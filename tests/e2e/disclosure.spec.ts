import {expect,test,type Page} from '@playwright/test';
async function nav(page:Page,label:string){
 if(await page.getByRole('button',{name:'메뉴 열기'}).isVisible()) await page.getByRole('button',{name:'메뉴 열기'}).click();
 await page.getByRole('navigation').getByRole('button',{name:label,exact:true}).click();
}
test('전체 학습 화면 상단 상시 배너 부재와 실제 화면 캡처', async({page},testInfo)=>{
 await page.goto('');
 await page.screenshot({path:`test-results/${testInfo.project.name}-dashboard.png`,fullPage:true});
 for(const label of ['실전 모의시험','랜덤 문제풀이','오답노트','북마크','학습 통계','문제은행 관리','학습 대시보드']){
  await nav(page,label);
  await expect(page.locator('.criteria-note')).toHaveCount(0);
  if(label!=='문제은행 관리') await expect(page.locator('main > .notice').filter({hasText:/비공식|공식 출제기준|잠정 규칙|검증 대기|기출 미제공/})).toHaveCount(0);
  await expect(page.getByLabel('학습 기준',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.getByRole('button',{name:'문제풀이 시작하기',exact:true}).click();
 await page.getByRole('group',{name:'답안 선택'}).getByRole('button').first().click();
 await page.screenshot({path:`test-results/${testInfo.project.name}-practice.png`,fullPage:true});
});
test('저장 실패 경고는 유지하고 화면을 멈추지 않는다',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Quota exceeded','QuotaExceededError')};});
 await page.goto('');
 await expect(page.getByRole('alert')).toContainText('기록을 저장하지 못했습니다');
 await page.getByRole('button',{name:'문제풀이 시작하기',exact:true}).click();
 await expect(page.locator('.question-stem')).toBeVisible();
 await expect(page.getByRole('alert')).toBeVisible();
});
