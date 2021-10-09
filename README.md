# 前端ts播放器
做这个项目的初衷是，我在一个视频网站看视频的时候，视频资源加载很慢，一个ts文件加载时间很久，阻塞住了整个视频的加载进程，且播放器没有积极地重试。

因此做此播放器主要解决，尽可能多的预缓存视频，而不是像一般播放器那样，播放到哪才预加载到哪。
严格控制单个ts文件加载时间，超过时间立马重试，避免长时间阻塞。


## 前端播放ts格式视频的思路
ts格式的视频，是将一个完整的视频分割为若干个ts文件，同时会有一个m3u8文件，保存了每个ts文件的时长，格式详情等等信息。
播放器在播放这样被拆分过的视频时，会先去获取m3u8描述文件，然后通过这个文件知道每个ts文件的url，然后才去加载对应的ts文件。

而前端多媒体组件，如video，传统的播放视频的方式是，写入一个mp4文件的url，播放的时候就需要完整地加载这个文件才能播放。
那么前端如何才能够播放拆分为ts文件的视频呢？

首先会依赖 mediasource技术。
JavaScript可以通过URL.createObjectURL方法生成一个临时的src, 该src和MediaSource对象绑定，MediaSource对象通过自己的SourceBuffer集合从外部接收数据，然后将数据输入到HTMLMediaElement对象进行数据解析播放。

我们可以往SourceBuffer动态地添加或者删除内容，播放器的可播放内容就会随着我们对SourceBuffer内容的操作而有相应的变化。
在这个场景中，我们可以将请求到的ts文件，转换为mp4格式，然后不断地添加到SourceBuffer中，实现使用video标签来播放ts格式的视频。

将ts文件转换为mp4，依赖一个mux.js的库。

## 项目开发
npm install的时候可能会出错，但是还是可以正常运行。   
mac上会有类似错误：
gyp: No Xcode or CLT version detected!   
gyp ERR! configure error    
gyp ERR! stack Error: `gyp` failed with exit code: 1





## 本项目的实现思路

本项目没有去请求 m3u8文件，而是只支持请求特定的有规律的连接，如
https://v.qiexiazai.com/fuckyou-9527/xr{{num}}/8000kb/hls/index{{index}}.ts

num表示的是视频的集数，index表示的是ts文件的序号。当num确定之后，就将index从0开始不停递增1去请求ts文件，一直到请求不到或者解析出错为止。

ajax加载ts文件，append到mediasource中。video元素播放mediasource中的流。下载文件的过程中设定了请求超时和加载超时，超时后会自动重试。

不同于常规播放器当前播放点在哪就只加载播放点附近数据的策略。本播放器会从头到尾按顺序一直加载文件，直到文件全部加载完毕。

视频总时长一开始为0，随着ts流不断被append，视频总时长会自动更新，增长。

由于soucebuffer有大小限制，所以要控制soucebuffer中的内容长度。比如当判断当前buffer中的内容长度大于30秒时，就删除前20秒的内容，视频的总长度是不会受到影响的。边加载边删除，保证buffer不会溢出。

一共维护了两组加载状态。第一组就是上面说的，边加载下一个ts文件边在超过时长的时候进行删除。这部分buffer是为了推进下载进度的buffer。而另一组是用于支持当前播放的buffer。

播放buffer是当前播放点附近的buffer，随着播放进度的推进，要持续地append后面的内容。当然也要保证播放buffer的长度不超过一定的值，如果超过了也需要执行remove操作，把播放点之前的内容给移除掉。

通过ajax加载到的ts数据都在本地用一个数组保存了起来。就算是在sourcebuffer中被remove了，后续也可以通过这个本地数组将数据重新添加进sourcebuffer中。
