/**
 * Pot Recognize Plugin – Doc2X API v2 · 最终修正版 (v1.4)
 * 关键点：先把 res.data 解析成对象，再取 pages[0].md
 */
async function recognize(base64, _lang, { config, utils }) {
    /* ---------- 工具 ---------- */
    const fetch = utils.network?.fetch ?? utils.http?.fetch ?? utils.tauriFetch;
    const Body  = utils.network?.Body  ?? utils.http?.Body;
    if (!fetch || !Body) throw Error("找不到网络请求工具");
  
    /* ---------- 校验 Key ---------- */
    const apikey = config.apikey?.trim();
    if (!apikey) throw Error("请先在插件设置里填写 Doc2X API Key");
  
    /* ---------- Base64 → Uint8Array ---------- */
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  
    /* ---------- 发送 OCR 请求 ---------- */
    const res = await fetch(
      "https://v2.doc2x.noedgeai.com/api/v2/parse/img/layout",
      { method: "POST",
        headers: { Authorization: `Bearer ${apikey}` },
        body: Body.bytes(bytes),
        responseType: 2,          // 期望 JSON，但某些 Pot 版本仍会返回字符串
        timeout: 60000 }
    );
  
    /* ---------- HTTP 级错误 ---------- */
    if (!res.ok) {
      throw Error(`HTTP ${res.status}: ${JSON.stringify(res.data ?? {})}`);
    }
  
    /* ---------- 解析 res.data ---------- */
    let d = res.data;
    if (typeof d === "string") {
      try { d = JSON.parse(d); }
      catch(e) { throw Error(`服务器返回非 JSON: ${d.slice(0,120)}…`); }
    }
  
    /* ---------- 拿结果 ---------- */
    const page = d?.data?.result?.pages?.[0];
    const md   = page?.md;
  
    if (md !== undefined && md !== null) {
      return md;                       // 成功：把 Markdown 返回给 Pot
    }
  
    /* ---------- 其它一律报错 ---------- */
    throw Error(`Doc2X 返回异常：${JSON.stringify(d)}`);
  }