# Smart Eyes Property Studio v3

Entry: `fly/flyer-maker-v3.html`. This is a separate sales-property editor; the existing rental pages remain available.

## Use

1. Enter the name, layout and area; expand the optional building, management and company sections as needed.
2. Upload JPG, PNG or WebP images. Assign the floorplan and exterior roles, add captions, and optionally choose a primary photograph. Disable photos that should be excluded.
3. Generate four compositions. Photo selection uses role, caption, aspect ratio and the primary-photo preference. It does not inspect image content with a vision model.
4. Choose a composition and click a photograph to replace it or adjust fit, position and zoom. Floorplans always use containment. The optional white-border trim works on a reversible copy.
5. Print the selected composition: A4 landscape, 100%, no browser headers/footers, background graphics enabled. Content overflow or changes made since generation block export until corrected or regenerated.
6. Save a JSON draft to retain data, compressed images, selected composition and crop settings. Reopen it later in the same editor.

The page processes images locally with no upload endpoint or third-party script. Drafts include the images and should be stored with the property materials. Images are normalized to a maximum 2200-pixel edge; accepted uploads are limited to 20 MB each. Draft imports are limited to 100 MB.

For investment properties, gross yield = annual rent / (price in万円 × 10,000). Blank expense fields remain unknown; a partial monthly total is labelled as the total of recorded costs. Price/tax status, area measurement method and source date can be marked as unconfirmed.

## Verification

Run `node --test tests/flyer-v3.test.cjs` and `node --check fly/v3/studio.js`.

Browser QA covers generation, selection, crop isolation, floorplan controls, draft download/reimport, and stale-data export prevention. Local property fixture `fly/v3-demo/` is ignored; `?demo=1` loads it only where that private fixture exists. Actual property images and generated PDFs are not part of the repository.

A local QA run with a real property confirmed four single-page A4 landscape PDFs and a four-page comparison PDF, then rasterized and inspected every composition. Source floorplan resolution limits output detail; use the original high-resolution plan when available.

## 独立风格与 JSON 复用

一键生成日式销售、大照片海报、杂志跨页、建筑图纸、销售广告、白金经典。四个新模板使用独立的 HTML 页面结构，代码位于 compositions.js / compositions.css；图片操作和资料字段共享，页面骨架各自设计。

保存 JSON 包含所有表单资料、内嵌图片、原图副本、素材开关、主图、说明、按风格 ID 保存的裁切调整和选中风格。重新导入即可修改并再生成，图片不依赖原始文件路径。旧 v3 四方案草稿可导入，照片调整按原布局迁移。修改资料后保存保留新资料和照片，重新生成前不保存已过期的方案调整。

验证：9 项 Node 测试；南池袋六种 A4 横向 PDF 渲染和溢出检查；浏览器生成六风格、JSON 实际下载与重新导入，恢复九张素材、选中黑金风格及完整显示照片设置。

## 全新页面构图

- 大照片海报：标题叠入主照片，右侧户型和售价，底部横向资料索引。
- 杂志跨页：中央书脊分隔；左边为标题、照片、价格，右边为户型、编号故事及小照片。
- 建筑图纸：超大户型图为中心，左工程参数，右竖向影像，尺寸标线与图纸签栏。
- 销售广告：巨型售价独立色块，主照片及细节拼接，黑框户型与底部资料。

南池袋测试户型图改用用户提供的 間取り.png（1219 × 1290）。新增导出检查覆盖整个纸面、故事、参数分区和独立侧栏；超长资料会提示精简。10 项测试通过，六页 A4 PDF 逐页渲染检查。
