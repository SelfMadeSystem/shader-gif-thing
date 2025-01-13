# shader-gif-thing

![Example](assets/example.gif)

## Installing

The main problems is with the `gl` node module and the `fluent-ffmpeg` package. The `gl` module is a native module that requires some dependencies to be installed on your system. The `fluent-ffmpeg` package requires `ffmpeg` and `ffprobe` to be installed on your system.

I only use Ubuntu-based systems, so I can only provide instructions for that. For other systems, good luck lol. I'll probably try getting it running on my nixOS system at some point and add a `flake.nix` file, but idk.

### On Linux

#### Ubuntu

On Ubuntu, these are the dependencies you need to install for the `gl` module to work:

```bash
sudo apt-get install libx11-dev libxi-dev libxext-dev build-essential libpixman-1-dev libcairo2-dev libpango1.0-dev libgif-dev libgl1-mesa-dev python-is-python3
```

For the `fluent-ffmpeg` package, you need to install `ffmpeg` and `ffprobe`:

```bash
sudo apt-get install ffmpeg
```

### On Windows

Follow the instructions for:

- [node-gyp](https://github.com/nodejs/node-gyp#on-windows)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg#prerequisites)
  - According to the project's README: most probably ffmpeg and ffprobe will *not* be in your `%PATH`, so you *must* set `%FFMPEG_PATH` and `%FFPROBE_PATH`.

### On MacOS

I don't have a Mac. Good luck.

There's [this](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg/wiki/Installing-ffmpeg-on-Mac-OS-X) for the `fluent-ffmpeg` package.

Apparently for macOS, you require `Python 3` and `Xcode` to be installed. I don't know if any other dependencies are required.

## Running

Be sure to `mkdir output` otherwise you're going to get file not found errors during image file generation.

To run the program, it is recommended to use `nvm` to install the latest version of node (version 23). This isn't strictly necessary, but it is recommended since it supports the `--experimental-strip-types` which means we don't need to use `tsc` to compile the typescript files.

```bash
# Run the program with the latest version of node
npm start
```

Otherwise, I've seen someone use `tsx` on node 20 to run the program.
