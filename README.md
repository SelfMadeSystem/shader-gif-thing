# shader-gif-thing

To install dependencies:

```bash
# On Ubuntu, these are the dependencies you need to install for the `gl` and `gif-encoder` node modules
sudo apt-get install libx11-dev libxi-dev libxext-dev build-essential libpixman-1-dev libcairo2-dev libpango1.0-dev libgif-dev libgl1-mesa-dev
# Install the node modules
npm install
```

To run the program, it is recommended to use `nvm` to install the latest version of node (version 23). This isn't strictly necessary, but it is recommended since it supports the `--experimental-strip-types` which means we don't need to use `tsc` to compile the typescript files.

```bash
# Run the program with the latest version of node
npm start
```
