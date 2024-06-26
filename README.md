# 阿林播放器
发现在一些小视频网站看视频的时候，视频资源加载很慢，一个ts文件加载时间很久，阻塞住了整个视频的加载进程，且播放器没有积极地重试。且预缓存的切片数不多，明明有时间缓存更多的后续片段，但是非要等到当前快播完了，才去加载，导致卡顿。   

针对这种资源加载慢的场景，需要一种更加高效的资源加载策略。   
可以并发地下载片段，提升下载速度；会严格控制单个ts文件加载时间，超过时间立马重试，避免长时间阻塞；会尽可能多的预缓存视频，而不是像一般播放器那样，播放到哪才预加载到哪。  

## 体验地址
http://cj.cyjx.cool/player/

![alt_text](./doc/play.png)

## 前端播放m3u8视频的思路
ts格式的视频，是将一个完整的视频分割为若干个ts文件，同时会生成一个m3u8文件，保存了每个ts文件的时长，格式详情等等信息。
播放器在播放这样被拆分过的视频时，会先去获取m3u8描述文件，然后通过这个文件知道每个ts文件的url，然后才去加载对应的ts文件。

而前端多媒体组件，如video，传统的播放视频的方式是，写入一个mp4文件的url，播放的时候就需要完整地加载这个文件才能播放。
那么前端如何才能够播放拆分为ts文件的视频呢？

首先会依赖 mediasource技术。
JavaScript可以通过URL.createObjectURL方法生成一个临时的src, 该src和MediaSource对象绑定，MediaSource对象通过自己的SourceBuffer从外部接收数据，然后将数据输入到HTMLMediaElement对象进行数据解析播放。

我们可以往SourceBuffer动态地添加或者删除内容，播放器的可播放内容就会随着我们对SourceBuffer内容的操作而有相应的变化。
我们可以将请求到的ts文件，转换为mp4格式，然后不断地添加到SourceBuffer中，实现video标签播放m3u8视频资源。

将ts文件转换为mp4，依赖一个mux.js的库。

## 本项目的实现思路


### 事件驱动
由于下载，解析，添加buffer等都是异步执行的，因此引入了订阅-发布模式，基于事件驱动来串联播放中涉及到的流程。

### 并发下载
下载ts片段时，不是下载好了一个片段再下载下一个，而是同时发起多个ajax请求进行下载，提高下载效率。

### 加载超时设计
ajax加下载ts文件的过程中设定了请求超时和加载超时，超时后会自动重试。

### soucebuffer设计
由于soucebuffer有大小限制，所以要控制soucebuffer中的内容长度。比如当判断当前buffer中的内容长度大于30秒时，就删除前20秒的内容。边加载边删除，保证buffer不会溢出。

### 数据缓存
通过ajax加载到的ts数据都在本地用一个数组保存了起来。就算是在sourcebuffer中被remove了，后续也可以通过这个本地数组将数据重新添加进sourcebuffer中。
