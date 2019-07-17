import { newE2EPage } from '@stencil/core/testing';

describe('read-along-text', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<read-along-text></read-along-text>');
    const element = await page.find('read-along-text');
    expect(element).toHaveClass('hydrated');
  });

  it('renders changes to the name data', async () => {
    const page = await newE2EPage();

    // await page.setContent('<read-along-text></read-along-text>');
    // const component = await page.find('read-along-text');
    // const element = await page.find('read-along-text >>> div');
    // expect(element.textContent).toEqual(`Hello, World! I'm `);

    // component.setProperty('middle', 'Earl');
    // await page.waitForChanges();
    // expect(element.textContent).toEqual(`Hello, World! I'm James Earl Quincy`);
  });
});
