jest.mock('meilisearch', () => {
  return {
    MeiliSearch: class MockMeiliSearch {
      index() {
        return {
          search: jest.fn().mockResolvedValue({
            hits: [],
          }),
        };
      }
    },
  };
});
