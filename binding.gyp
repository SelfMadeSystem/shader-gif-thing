{
  "targets": [
    {
      "target_name": "cgif_addon",
      "sources": [
        "cgif_addon.cpp",
        "cgif/src/cgif.c",
        "cgif/src/cgif_raw.c",
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")",
        "<!(node -p \"require('node-addon-api').include_dir\")",
        "cgif/inc"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "libraries": [
        "-lOpenCL",
        "-limagequant"
      ]
    }
  ]
}