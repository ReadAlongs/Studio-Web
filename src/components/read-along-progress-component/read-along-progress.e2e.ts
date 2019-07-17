import { newE2EPage } from '@stencil/core/testing';

describe('read-along-progress', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<read-along-progress></read-along-progress>');
    const element = await page.find('read-along-progress');
    expect(element).toHaveClass('hydrated');
  });

  it('renders changes to the name data', async () => {
    const page = await newE2EPage();

    // await page.setContent('<read-along-progress></read-along-progress>');
    // const component = await page.find('read-along-progress');
    // const element = await page.find('read-along-progress >>> div');
    // expect(element.textContent).toEqual(`Hello, World! I'm `);

    // component.setProperty('middle', 'Earl');
    // await page.waitForChanges();
    // expect(element.textContent).toEqual(`Hello, World! I'm James Earl Quincy`);
  });
});
