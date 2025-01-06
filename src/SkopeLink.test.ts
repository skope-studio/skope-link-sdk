import { SkopeLinkSdk } from './SkopeLink';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('EventTrackerSDK', () => {
  let tracker: SkopeLinkSdk;

  beforeEach(() => {
    tracker = new SkopeLinkSdk();
    fetchMock.resetMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should throw an error if apiKey or endpoint are missing', () => {
      expect(() => tracker.init({ apiKey: '', endpoint: '' })).toThrow(
        'API Key and Endpoint are required for initialization.'
      );
    });

    test('should initialize with default batchSize and retryAttempts if not provided', () => {
      tracker.init({
        apiKey: 'test_api_key',
        endpoint: 'https://api.example.com',
      });
      const config = (tracker as any).config;
      expect(config.batchSize).toBe(10);
      expect(config.retryAttempts).toBe(3);
    });

    test('should initialize correctly with valid config', () => {
      tracker.init({
        apiKey: 'test_api_key',
        endpoint: 'https://api.example.com',
        batchSize: 5,
        retryAttempts: 2,
        userId: 'user123',
      });
      const config = (tracker as any).config;
      expect(config.apiKey).toBe('test_api_key');
      expect(config.endpoint).toBe('https://api.example.com');
      expect(config.batchSize).toBe(5);
      expect(config.retryAttempts).toBe(2);
      expect(config.userId).toBe('user123');
    });
  });

  describe('Tracking', () => {
    beforeEach(() => {
      tracker.init({
        apiKey: 'test_api_key',
        endpoint: 'https://api.example.com',
      });
    });

    test('should warn if track is called before init', () => {
      console.warn = jest.fn();
      const uninitializedTracker = new SkopeLinkSdk();
      uninitializedTracker.track('test_event', { key: 'value' });

      expect(console.warn).toHaveBeenCalledWith(
        'SDK not initialized. Call init() before tracking events.'
      );
    });

    test('should add events to the queue', () => {
      tracker.track('test_event', { key: 'value' });

      const eventQueue = (tracker as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
      expect(eventQueue[0]).toMatchObject({
        eventName: 'test_event',
        eventData: { key: 'value' },
      });
    });

    test('should flush the queue automatically when batchSize is reached', () => {
      tracker.init({
        apiKey: 'test_api_key',
        endpoint: 'https://api.example.com',
        batchSize: 2,
      });

      tracker.track('event_1', {});
      tracker.track('event_2', {});

      const eventQueue = (tracker as any).eventQueue;
      expect(eventQueue).toHaveLength(0); // Cola debería estar vacía tras el flush
    });
  });

  describe('Flush', () => {
    beforeEach(() => {
      tracker.init({
        apiKey: 'test_api_key',
        endpoint: 'https://api.example.com',
      });
    });

    test('should send events to the API', async () => {
      const mockedDate = '2025-01-06T10:43:51.473Z';
      jest.spyOn(global, 'Date').mockImplementation(
        () =>
          ({
            toISOString: () => mockedDate,
          } as unknown as Date)
      );

      tracker.track('test_event', { key: 'value' });

      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));

      await tracker.flush();

      expect(fetchMock).toHaveBeenCalledWith('https://api.example.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test_api_key',
        },
        body: JSON.stringify({
          events: [
            {
              eventName: 'test_event',
              eventData: { key: 'value' },
              userId: undefined,
              timestamp: mockedDate,
            },
          ],
        }),
      });
    });

    test('should retry failed requests and requeue events', async () => {
      tracker.track('test_event', { key: 'value' });

      fetchMock.mockRejectOnce(new Error('Network error'));

      await tracker.flush();

      const eventQueue = (tracker as any).eventQueue;
      expect(eventQueue).toHaveLength(1);
    });

    test('should not flush if there are no events in the queue', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));

      await tracker.flush();

      expect(fetchMock).not.toHaveBeenCalled();
    });

    test('should handle consecutive flush calls gracefully', async () => {
      tracker.track('event_1', {});
      tracker.track('event_2', {});

      fetchMock.mockResponseOnce(JSON.stringify({ success: true }));

      const flushPromise1 = tracker.flush();
      const flushPromise2 = tracker.flush();

      await Promise.all([flushPromise1, flushPromise2]);

      expect(fetchMock).toHaveBeenCalledTimes(1); // Solo debería llamar a la API una vez
    });
  });
});
