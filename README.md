[![Version][version-badge]][marketplace]
[![Installs][installs-badge]][marketplace]

## Features

### Create C++ projects and classes with just few clicks, for MSVC, GCC and Clang

### It works with MSVC (Windows), GCC (Linux) and Clang (macOS)

### Creating a new project will do the following:
    - Project structure: Common folders like src, include and bin
    - Makefile: A makefile already set up to build and run your project
    - VSCode tasks: Configurations for building and running your project
    - VSCode debug configuration: Debugging already setup for Visual Studio Debugger, GDB and LLDB
    - Add new classes easily with the `Create new class` command

### Creating class will create the appropiate files using one of the templates avaliable [here](https://github.com/acharluk/easy-cpp-projects/tree/master/templates/classes)

---

## Getting started

1. Install the compiler you want to use, look the _Requirements_ section below
2. Open a new folder in VSCode
3. Open the command palette (F1) and search for `easy cpp`, then press the `Create new C++ project` option
4. Enjoy programming! Now you can compile your code using the `Build & Run` button in the status bar at the bottom or F7, you can also set breakpoints and use the debugger!

---

## Requirements

### Windows

- You must have MSVC or GCC installed:
    + MSVC can be installed using Build Tools for Visual Studio 2017 from [here](https://www.visualstudio.com/downloads/)
    + GCC Windows 10: Install GCC and Make on Windows through WSL: [Windows Subsystem for Linux setup](https://github.com/acharluk/UsefulStuff/blob/master/windows/setup_wsl.md)
    + GCC Windows 8.1 or lower: Install GCC and Make using [Cygwin](https://www.cygwin.com/) or [MinGW](http://www.mingw.org/)

### GNU/Linux

- Install GCC, Make and GDB using the package manager of your distribution, these are some of them:
    + Debian/Ubuntu/Mint: `sudo apt install g++ make gdb`
    + Fedora: `sudo dnf install gcc-c++ make gdb`
    + Arch Linux: `sudo pacman -S gcc make gdb`

### MacOS

- GCC: Check out [Brew](https://brew.sh/)
- Clang:
    + Open a Terminal
    + Run the command `xcode-select --install`
    + A dialog will appear telling you that it requires the command line developer tools, and asks if you would like to install them. Click on the "Install" button

## Note:
- You should install C/C++ VSCode extension for the best experience, avaliable [here](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools)
- Alternatively you can run this command from the command palette: `ext install ms-vscode.cpptools`

---

[version-badge]: https://vsmarketplacebadge.apphb.com/version/ACharLuk.easy-cpp-projects.svg
[installs-badge]: https://vsmarketplacebadge.apphb.com/installs/ACharLuk.easy-cpp-projects.svg
[marketplace]: https://marketplace.visualstudio.com/items?itemName=ACharLuk.easy-cpp-projects