import imageScale from '../../src/image-scale';

describe('imageScale', () => {
  describe('Greet function', () => {
    beforeEach(() => {
      spy(imageScale, 'greet');
      imageScale.greet();
    });

    it('should have been run once', () => {
      expect(imageScale.greet).to.have.been.calledOnce;
    });

    it('should have always returned hello', () => {
      expect(imageScale.greet).to.have.always.returned('hello');
    });
  });
});
