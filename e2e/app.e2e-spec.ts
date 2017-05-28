import { GraphDemoPage } from './app.po';

describe('graph-demo App', function() {
  let page: GraphDemoPage;

  beforeEach(() => {
    page = new GraphDemoPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
