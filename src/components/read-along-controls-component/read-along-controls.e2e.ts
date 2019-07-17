import { newE2EPage } from '@stencil/core/testing';

describe('read-along-controls', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<read-along--controls></read-along-controls>');
    const element = await page.find('read-along-controls');
    expect(element).toHaveClass('hydrated');
  });

  it('renders changes to the name data', async () => {
    const page = await newE2EPage();

    // await page.setContent('<read-along-controls></read-along-controls>');
    // const component = await page.find('read-along-controls');
    // const element = await page.find('read-along-controls >>> div');
    // expect(element.textContent).toEqual(`Hello, World! I'm `);

    // component.setProperty('middle', 'Earl');
    // await page.waitForChanges();
    // expect(element.textContent).toEqual(`Hello, World! I'm James Earl Quincy`);
  });
});
