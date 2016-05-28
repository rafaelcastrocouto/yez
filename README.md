# Yez!

> NodeJs app that kills the terminal and act as a task runner

## Installation

* [Yez! Node.js module](https://github.com/krasimir/yez) `npm install -g yez`
* [Yez! Chrome extension (optional)](https://chrome.google.com/webstore/detail/yez/acbhddemkmodoahhmnphpcfmcfgpjmap)

## Usage

1. Install the Yez! module by running `npm install -g yez` or<br />`npm install -g https://registry.npmjs.org/yez/-/yez-2.0.1.tgz`.<br />If you have problems installing the module please check out the [this thread](https://github.com/krasimir/yez/issues/1).

2. Run `yez` in your console

3. Open Chrome browser and install the [extension](https://chrome.google.com/webstore/detail/yez/acbhddemkmodoahhmnphpcfmcfgpjmap)

4. Open Chrome's DevTools and find the Yez! tab

(Have in mind that when you run the backend of Yez! the app is available at http://localhost:9173/)

## Chrome extension shortcuts

To open Yez! just press `Ctrl+Shift+I` which openes the DevTools console. Just after that press `Ctrl+]` till you reach the needed tab.

* `Ctrl+l` - clearing the command output panel
* `Ctrl+Enter` - restarting the task
* `Ctrl+i` - bring the focus to the input field
* `Ctrl+\` - opens a new terminal
* `Ctrl+c` - stops the run tasks

## Running tests

```js
npm test
```

## Articles

* [Sorry, Chrome killed the terminal](http://krasimirtsonev.com/blog/article/Sorry-Chrome-killed-the-terminal)
* [Developing Node.js applications with Google Chrome](http://krasimirtsonev.com/blog/article/Developing-Nodejs-applications-with-Google-Chrome)

## Screenshots

Using the extension as terminal

![Yez!](http://krasimirtsonev.com/blog/articles/ChromeKilledTheTerminal/imgs/yez_01.gif)

Creating a simple task

![Yez!](http://krasimirtsonev.com/blog/articles/ChromeKilledTheTerminal/imgs/yez_02.gif)

List of all added tasks

![Yez!](http://work.krasimirtsonev.com/git/yez/yez-screenshot-1.jpg)

Creating a task which runs the Yez! tests

![Yez!](http://work.krasimirtsonev.com/git/yez/yez-screenshot-2.jpg)

The result after runnning the task

![Yez!](http://work.krasimirtsonev.com/git/yez/yez-screenshot-5.jpg)

Creating a task which opens Twitter and checks the latest news about #nodejs

![Yez!](http://work.krasimirtsonev.com/git/yez/yez-screenshot-3.jpg)

The result after runnning the task

![Yez!](http://work.krasimirtsonev.com/git/yez/yez-screenshot-4.jpg)
