# DSN-Speed-Test

> 检测 NS 服务的响应速度。检测方式是通过 puppeteer 模拟请求一个网站，然后读取 performance.timing 中 domainLookupEnd 和 domainLookupStart 的差值来获取本次请求的 DNS 耗时。请求成功的网站会截屏并记录 DNS 耗时，请求失败的不保存也不参与计算。

最终计算的指标包含某个 NS 服务响应耗时的：

- 平均值
- 最大的 5 个值
- p50 (中位数)
- p90（90% 的数据小于这个值）

CTRL + C 可以中断测试，直接返回已完成部分的结果，下次再次执行时，会从中断的位置继续，可以在测试用例的尾部添加用例。

### 使用方式

```
yarn start [version]
```

`version` 可以替换成下面列出的值，比如 `yarn start dnspod-v5`，项目里预设了使用了不同 DNSPod 解析套餐的域名

- `dnspod-v5` DNSPod 旗舰版 ns3.dnsv5.com，ns4.dnsv5.com (596 条用例)
- `dnspod-v4` DNSPod 企业版 ns3.dnsv4.com，ns4.dnsv4.com (2104 条用例)
- `dnspod-v2` DNSPod 专业版 ns3.dnsv2.com，ns4.dnsv2.com (7108 条用例)
- `dnspod-v0` DNSPod 免费版 f1g1ns1.dnspod.net. f1g1ns2.dnspod.net. (10000 条用例)

可以参考代码，自己通过工具获取其他 NS 服务的在用域名来测速。

![image](https://user-images.githubusercontent.com/5093611/135428518-d357e34f-f87d-49f9-a8f3-6b17b8bbbf1c.png)
![image](https://user-images.githubusercontent.com/5093611/135428671-a2bb7c62-5562-4879-a925-9f2e451e05d5.png)

### 辅助工具

- 检查某个域名使用的 NS 服务：https://dns.tech/
- 反查使用了某个 NS 服务的域名：如 https://securitytrails.com/list/ns/ns3.dnsv5.com 就表示查询 NS 服务是 ns3.dnsv5.com 的域名
- dig +trace 域名
- 腾讯云华佗诊断系统 https://ping.huatuo.qq.com/
- 阿里云网站诊断工具 https://zijian.aliyun.com/

### 刷新本地 DNS 缓存

- Mac

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder # 10.15+
sudo killall -HUP mDNSResponder # 10.11+
sudo discoveryutil udnsflushcaches # 10.10
sudo killall -HUP mDNSResponder # 10.7 - 10.9
sudo dscacheutil -flushcache # 10.6
sudo lookupd -flushcache # 10.5
```

- Chrome

```
chrome://net-internals/#dns
```

- Windows

```bash
ipconfig /flushdns
```

- Ubuntu

```bash
sudo systemd-resolve --flush-caches
```

- 其他 Linux

```bash
sudo /etc/init.d/dns-clean start
```
