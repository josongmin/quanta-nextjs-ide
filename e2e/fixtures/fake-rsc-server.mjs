import http from 'node:http';

// Minimal Next.js RSC payload simulator for e2e tests.
// Variants: ?v=a (default, 13 chunks) | ?v=b (12 chunks; chunk 10 mutated, chunk 12 removed)
// /__health for Playwright webServer readiness probe.

const lines = [
  ['M{"id":"./components/RootLayout.js","chunks":["app/layout-1ab2.js"],"name":""}', 0],
  ['I["MainLayout",["chunks/app-layout-9f1e.js"],"default"]', 12],
  ['["$","$L1",null,{"locale":"en-US","children":"$L3"}]', 24],
  ['I["ProductPage",["chunks/product-page-c14a.js"],"default"]', 38],
  ['$Sreact.suspense', 52],
  ['["$","$L4",null,{"fallback":"$L6","children":"$L7"}]', 70],
  ['["$","div",null,{"className":"skeleton","children":"Loading…"}]', 80],
  ['I["ProductDetails",["chunks/product-details-7c10.js"],"default"]', 110],
  ['["$","$L7",null,{"id":"sku_88421","children":["$","$L9",null,{"product":"$@10"}]}]', 142],
  ['I["AddToCart",["chunks/add-to-cart-2bf1.js"],"default"]', 168],
  ['@{"id":"sku_88421","title":"Walnut Side Table","priceCents":12900}', 195],
  ['"Walnut Side Table — handcrafted from FSC walnut."', 240],
  ['"$/"', 280],
];

function streamPayload(res, variant) {
  res.writeHead(200, {
    'Content-Type': 'text/x-component',
    'Transfer-Encoding': 'chunked',
    'Access-Control-Allow-Origin': '*',
  });
  let i = 0;
  let prev = 0;
  const writeNext = () => {
    if (i >= lines.length) {
      res.end();
      return;
    }
    const [payload, atMs] = lines[i];
    let line = `${i}:${payload}\n`;
    if (variant === 'b' && i === 10) {
      line = `${i}:@{"id":"sku_88421","title":"Walnut Side Table","priceCents":13900,"badge":"new"}\n`;
    }
    if (variant === 'b' && i === 12) {
      i += 1;
      writeNext();
      return;
    }
    res.write(line);
    const delay = atMs - prev;
    prev = atMs;
    i += 1;
    setTimeout(writeNext, Math.max(0, delay));
  };
  writeNext();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname === '/__health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }
  const variant = url.searchParams.get('v') ?? 'a';
  streamPayload(res, variant);
});

const PORT = Number(process.env.FAKE_RSC_PORT ?? 3000);
server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[fake-rsc] listening on :${PORT}`);
});
