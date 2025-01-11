# shader-gif-thing

## Installing

The main problems is with the `gl` node module.

### On Linux

#### Ubuntu

On Ubuntu, these are the dependencies you need to install for the `gl` module to work:

```bash
sudo apt-get install libx11-dev libxi-dev libxext-dev build-essential libpixman-1-dev libcairo2-dev libpango1.0-dev libgif-dev libgl1-mesa-dev python-is-python3
```

### On Windows

Follow the instructions for:

- [node-gyp](https://github.com/nodejs/node-gyp#on-windows)

### On MacOS

I don't have a Mac. Good luck.

## Running

Be sure to `mkdir output` otherwise you're going to get file not found errors during image file generation.

To run the program, it is recommended to use `nvm` to install the latest version of node (version 23). This isn't strictly necessary, but it is recommended since it supports the `--experimental-strip-types` which means we don't need to use `tsc` to compile the typescript files.

```bash
# Run the program with the latest version of node
npm start
```

Otherwise, I've seen someone use `tsx` to run the program, but I haven't tested it.
