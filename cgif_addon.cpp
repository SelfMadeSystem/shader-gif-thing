#include <CL/cl.h>
#include <iostream>
#include <napi.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <vector>
#include <libimagequant.h>

#include "cgif.h"

cl_platform_id platform_id     = nullptr;
cl_device_id device_id         = nullptr;
cl_context context             = nullptr;
cl_command_queue command_queue = nullptr;
cl_program program             = nullptr;
cl_kernel kernel               = nullptr;

void setupOpenCL() {
  cl_int ret;
  ret = clGetPlatformIDs(1, &platform_id, nullptr);
  ret = clGetDeviceIDs(platform_id, CL_DEVICE_TYPE_GPU, 1, &device_id, nullptr);
  context = clCreateContext(nullptr, 1, &device_id, nullptr, nullptr, &ret);
  command_queue = clCreateCommandQueue(context, device_id, 0, &ret);
}

void quantizeFrame(uint8_t* pImageData, uint8_t* aPalette, int width,
                   int height, int numColors) {
  cl_int ret;
  cl_mem image_mem =
      clCreateBuffer(context, CL_MEM_READ_ONLY,
                     width * height * sizeof(uint8_t), nullptr, &ret);
  cl_mem palette_mem =
      clCreateBuffer(context, CL_MEM_WRITE_ONLY,
                     numColors * 4 * sizeof(uint8_t), nullptr, &ret);

  ret = clEnqueueWriteBuffer(command_queue, image_mem, CL_TRUE, 0,
                             width * height * sizeof(uint8_t), pImageData, 0,
                             nullptr, nullptr);

  const char* source = R"(
    __kernel void quantize(__global uchar* image, __global uchar* palette, int width, int height, int numColors) {
      int i = get_global_id(0);
      int j = get_global_id(1);
      int idx = j * width + i;

      int colorIdx = (image[idx] / 255.0) * (numColors - 1);
      palette[colorIdx * 4 + 0] = image[idx];
      palette[colorIdx * 4 + 1] = image[idx];
      palette[colorIdx * 4 + 2] = image[idx];
    }
  )";

  program = clCreateProgramWithSource(context, 1, &source, nullptr, &ret);
  ret     = clBuildProgram(program, 1, &device_id, nullptr, nullptr, nullptr);
  kernel  = clCreateKernel(program, "quantize", &ret);

  ret = clSetKernelArg(kernel, 0, sizeof(cl_mem), &image_mem);
  ret = clSetKernelArg(kernel, 1, sizeof(cl_mem), &palette_mem);
  ret = clSetKernelArg(kernel, 2, sizeof(int), &width);
  ret = clSetKernelArg(kernel, 3, sizeof(int), &height);
  ret = clSetKernelArg(kernel, 4, sizeof(int), &numColors);

  size_t global_work_size[2] = {(size_t)width, (size_t)height};
  ret = clEnqueueNDRangeKernel(command_queue, kernel, 2, nullptr,
                               global_work_size, nullptr, 0, nullptr, nullptr);

  ret = clEnqueueReadBuffer(command_queue, palette_mem, CL_TRUE, 0,
                            numColors * 4 * sizeof(uint8_t), aPalette, 0,
                            nullptr, nullptr);

  clReleaseMemObject(image_mem);
  clReleaseMemObject(palette_mem);
}

static void initGIFConfig(CGIF_Config* pConfig, char* path, uint16_t width,
                          uint16_t height, uint8_t* pPalette,
                          uint16_t numColors) {
  memset(pConfig, 0, sizeof(CGIF_Config));
  pConfig->width                   = width;
  pConfig->height                  = height;
  pConfig->pGlobalPalette          = pPalette;
  pConfig->numGlobalPaletteEntries = numColors;
  pConfig->path                    = path;
  pConfig->attrFlags               = CGIF_ATTR_IS_ANIMATED;
}

static void initFrameConfig(CGIF_FrameConfig* pConfig, uint8_t* pImageData,
                            uint16_t delay) {
  memset(pConfig, 0, sizeof(CGIF_FrameConfig));
  pConfig->delay      = delay;
  pConfig->pImageData = pImageData;
}

Napi::Value CreateGif(const Napi::CallbackInfo& info) {
  Napi::Env env = info.Env();

  if (info.Length() < 5 || !info[0].IsString() || !info[1].IsArray() ||
      !info[2].IsNumber() || !info[3].IsNumber() || !info[4].IsNumber()) {
    Napi::TypeError::New(env,
                         "Expected a string, an array of Uint8ClampedArray, "
                         "and three numbers as arguments")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  std::string path        = info[0].As<Napi::String>().Utf8Value();
  Napi::Array framesArray = info[1].As<Napi::Array>();
  int width               = info[2].As<Napi::Number>().Int32Value();
  int height              = info[3].As<Napi::Number>().Int32Value();
  int delay               = info[4].As<Napi::Number>().Int32Value();

  uint32_t numFrames = framesArray.Length();
  if (numFrames == 0) {
    Napi::TypeError::New(env, "Frames array cannot be empty")
        .ThrowAsJavaScriptException();
    return env.Null();
  }

  CGIF* pGIF;
  CGIF_Config gConfig;
  CGIF_FrameConfig fConfig;
  uint8_t aPalette[256 * 4];
  uint16_t numColors = 256;

  setupOpenCL();

  initGIFConfig(&gConfig, const_cast<char*>(path.c_str()), width, height,
                aPalette, numColors);
  pGIF = cgif_newgif(&gConfig);

  for (uint32_t f = 0; f < numFrames; ++f) {
    Napi::Uint8Array frameDataArray = framesArray.Get(f).As<Napi::Uint8Array>();
    if (frameDataArray.ElementLength() != width * height * 4) {
      Napi::TypeError::New(
          env, "Frame data size does not match the expected dimensions")
          .ThrowAsJavaScriptException();
      return env.Null();
    }

    uint8_t* pImageData = frameDataArray.Data();
    quantizeFrame(pImageData, aPalette, width, height, numColors);
    initFrameConfig(&fConfig, pImageData, delay);
    cgif_addframe(pGIF, &fConfig);
  }
  cgif_close(pGIF);

  return Napi::String::New(env, "GIF created successfully");
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
  exports.Set(Napi::String::New(env, "createGif"),
              Napi::Function::New(env, CreateGif));
  return exports;
}

NODE_API_MODULE(cgif_addon, Init)
