import { expect, test, type Page } from "@playwright/test";

async function open(page: Page) {
  await page.getByRole("button", { name: "메뉴 열기", exact: true }).click();
  await expect(page.locator(".sidebar")).toHaveClass(/open/);
  await page.waitForTimeout(250); // fixed drawer transition must finish before real input
}
async function visibleInViewport(page: Page, text: string) {
  const button = page.locator(".sidebar").getByRole("button", {name:text,exact:true});
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  return button;
}
for (const size of [{width:390,height:480},{width:740,height:360}]) {
  test(`실제 휠로 하단 초기화와 상단 대시보드 접근 ${size.width}x${size.height}`, async ({page}) => {
    await page.setViewportSize(size);
    await page.goto("");
    await open(page);
    const sidebar=page.locator(".sidebar");
    await page.mouse.move(120, size.height/2);
    await page.mouse.wheel(0, 1600);
    await expect.poll(()=>sidebar.evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await expect.poll(async()=> {
      const r=await sidebar.getByRole("button",{name:"데이터 초기화",exact:true}).boundingBox();
      return !!r && r.y>=0 && r.y+r.height<=size.height;
    }).toBe(true);
    const reset=await visibleInViewport(page,"데이터 초기화");
    await visibleInViewport(page,"학습 기록 백업");
    const before=await sidebar.evaluate(el=>el.scrollTop);
    await page.mouse.wheel(0,1600);
    await page.waitForTimeout(200);
    expect(await sidebar.evaluate(el=>el.scrollTop)).toBe(before);
    expect(await page.evaluate(()=>window.scrollY)).toBe(0);
    await reset.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button",{name:"돌아가기",exact:true}).click();
    await page.mouse.move(120,size.height/2);
    await page.mouse.wheel(0,-1600);
    await expect.poll(()=>sidebar.evaluate(el=>el.scrollTop)).toBe(0);
    await (await visibleInViewport(page,"학습 대시보드")).click();
    await expect(sidebar).not.toHaveClass(/open/);
    await expect(page.getByRole("heading",{name:"정보처리기사 필기 CBT"})).toBeVisible();
  });
  test(`실제 터치 스와이프로 메뉴 양끝 접근 ${size.width}x${size.height}`, async ({page,context,isMobile}) => {
    test.skip(!isMobile,"터치 에뮬레이션 프로젝트에서 실행");
    await page.setViewportSize(size);
    await page.goto("");
    await open(page);
    const cdp=await context.newCDPSession(page);
    const swipe=async (from:number,to:number)=>{
      await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:125,y:from}]});
      for(let i=1;i<=12;i++){
        await cdp.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:125,y:from+(to-from)*i/12}]});
        await page.waitForTimeout(18);
      }
      await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
      await page.waitForTimeout(250);
    };
    for(let i=0;i<4;i++) await swipe(size.height-35,65);
    expect(await page.locator(".sidebar").evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
    await visibleInViewport(page,"학습 기록 백업");
    await visibleInViewport(page,"데이터 초기화");
    const download=page.waitForEvent("download");
    await page.getByRole("button",{name:"학습 기록 백업",exact:true}).tap();
    expect((await download).suggestedFilename()).toContain("backup.json");
    for(let i=0;i<4;i++) await swipe(70,size.height-35);
    await expect.poll(()=>page.locator(".sidebar").evaluate(el=>el.scrollTop)).toBe(0);
    await visibleInViewport(page,"학습 대시보드");
    await page.getByRole("button",{name:"학습 대시보드",exact:true}).tap();
    await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
    await page.screenshot({path:`test-results/menu-touch-${size.width}x${size.height}.png`});
  });
}
test("확대 글자·짧은 데스크톱 창에서도 메뉴 독립 스크롤",async({page})=>{
  await page.setViewportSize({width:1000,height:360});
  await page.goto("");
  await page.addStyleTag({content:".sidebar nav button { font-size: 24px; }"});
  await page.mouse.move(100,220);
  await page.mouse.wheel(0,2200);
  await expect.poll(()=>page.locator(".sidebar").evaluate(el=>el.scrollTop)).toBeGreaterThan(0);
  await visibleInViewport(page,"데이터 초기화");
  await page.mouse.wheel(0,-2200);
  await expect.poll(()=>page.locator(".sidebar").evaluate(el=>el.scrollTop)).toBe(0);
  await visibleInViewport(page,"학습 대시보드");
});
