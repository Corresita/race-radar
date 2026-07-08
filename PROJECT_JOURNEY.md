# Project Journey

记录 Race Radar 从想法到实现的探索过程。

## 起点：一个跑者的痛点（2026-07）

想做一个越野比赛提醒的网站 + app，主要覆盖 UTMB 系列和 World Trail Majors。核心场景：订阅感兴趣的比赛，报名开放时收到邮件提醒——热门越野赛经常开放当天就报满，错过窗口就要再等一年。

## 调研：GitHub 上有没有人做过？

搜了两轮，结论是**没有直接重合的项目**，但找到一批"零件"级别的参考：

| 仓库 | 相关点 |
|---|---|
| [jdmc24/marathon-dashboard](https://github.com/jdmc24/marathon-dashboard) | 概念最接近的"整机"：比赛数据库 + 报名截止追踪 + 邮件提醒（Gmail API + node-cron），但只做美国路跑马拉松 |
| [luisaneubauer/ultra-calendar](https://github.com/luisaneubauer/ultra-calendar) | Git 管理的越野赛 YAML 数据 + 生成 `.ics` 日历订阅，领域相同但没有网站和提醒 |
| [petecog/cycle-calendar](https://github.com/petecog/cycle-calendar) | UCI 山地车赛历：爬官方数据 → iCal → GitHub Actions 每周更新 → GitHub Pages，零服务器成本的订阅模式 |
| [ByungHeonLEE/marathon_check_bot](https://github.com/ByungHeonLEE/marathon_check_bot)、[tbowww/race-registration-scraper](https://github.com/tbowww/race-registration-scraper) | 轮询报名页 → 推送提醒，验证了监测机制可行 |
| [thibtd/DataEng_UTMB_pipeline](https://github.com/thibtd/DataEng_UTMB_pipeline) | 唯一专门做 UTMB 数据的项目（数据管道 + 推荐系统） |
| [ricfog/TRAP-data](https://github.com/ricfog/TRAP-data) | ITRA + UTMB 数据集（2021 年，已停更），了解数据形态用 |

商业产品 [RaceNotify](https://racenotify.com/en) 在做同样的"报名开放提醒"，说明需求真实存在，但闭源、以欧洲路跑为主。**UTMB + WTM 这个细分是空白。**

## 第一次数据 review：发现自己搞混了两个体系

最初手工整理的 `races.json` 有个大坑：把 UTMB World Series 里的 Majors 级别赛事（Tarawera、Canyons、Lavaredo 等，域名都是 `*.utmb.world`）错标成了 "World Trail Majors"。实际上 **World Trail Majors 是和 UTMB 竞争的独立联盟**，2026 赛季是固定的 10 场（HK100、Black Canyon、Transgrancanaria、Mt. FUJI 100、MIUT、South Downs Way 100、Quebec Mega Trail、Vietnam Mountain Marathon、Grampians Peaks、Ultra-Trail Cape Town）。

教训：越野赛的"系列"归属是产品的核心分类，必须以各系列官网为准，不能凭印象。

## Schema 重设计：从"截止日期"转向"报名窗口"

第一版 schema 只有 `registrationDeadline`（截止日），但产品的核心承诺是"**报名开放时**提醒"。对先到先得的热门赛，开放日远比截止日重要。重构成：

- `registrationOpens` / `registrationCloses`——完整的报名窗口，未公布则为 `null`（UI 显示 TBA）
- `entryMethod`——`lottery`（UTMB Mont-Blanc、HK100、MIUT 等）vs `first-come`，决定提醒文案（"抽签窗口开放" vs "开抢"）
- 状态机 `announced → reg_open → reg_closed / sold_out → completed`，替代原来含糊的 status 字段，未来邮件触发就挂在状态流转上

## 第一次爬取：UTMB 官网的数据比想象中好拿（2026-07-08）

UTMB 各分站（`*.utmb.world`）是 Next.js 站点，页面里的 `__NEXT_DATA__` JSON 直接包含赛事日期和每个组别的报名状态（`registration_open` / `registration_sold_out` / `registration_closed` / `available_soon`），不需要 headless 浏览器。一轮爬下来修正了一批手工数据的错误：

- Kullamannen 实际是 10月30-31日（手工记成了 11月6日）；TransLantau 是 11月13-15日；Kosciuszko 是 11月26-28日
- Tarawera / Chianti 已滚动到 2027 赛季且报名已开放；Canyons / Lavaredo 2027 显示 "available soon"
- Eiger 2026 除儿童组全部售罄；TransLantau100 还开放但 50/25/15 已售罄

这验证了自动化数据管道可行：定时爬 `__NEXT_DATA__` → 更新 JSON → 状态变化时触发提醒。WTM 各家网站技术栈不一（下一步逐个适配）。

## 决定：先发布，公开迭代

仓库很干净（无敏感文件），与其憋到"完美"再发，不如先上 GitHub 慢慢迭代——这类项目的价值在数据持续更新，而且 GitHub Actions / Pages 本身就是后续自动化的基础设施。

## Roadmap

1. ✅ 数据 schema 围绕报名窗口重构，修正系列归属
2. ✅ 网站：浏览 + 筛选 + 报名窗口倒计时
3. ⬜ iCal 订阅（参考 cycle-calendar 模式，零成本先跑起来）
4. ⬜ GitHub Actions 定时爬取 UTMB `__NEXT_DATA__`，自动更新状态
5. ⬜ 订阅 + 邮件提醒（报名开放 / 即将截止）
6. ⬜ WTM 各站点爬虫适配
7. ⬜ 移动端 app
