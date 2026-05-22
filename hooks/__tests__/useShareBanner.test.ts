import { renderHook, act } from '@testing-library/react-hooks';
import { useShareBanner } from '../useShareBanner';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';

// Mock dependencies
jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  getAlbumAsync: jest.fn(),
  addAssetsToAlbumAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

jest.mock('react-native-view-shot', () => ({
  captureRef: jest.fn(),
}));

describe('useShareBanner Hook', () => {
  let viewRef: any;

  beforeEach(() => {
    jest.clearAllMocks();
    viewRef = { current: {} }; // Mock ref
  });

  it('should capture view and set bannerUri', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (captureRef as jest.Mock).mockResolvedValue('file://mock-uri');

    const { result, waitForNextUpdate } = renderHook(() => useShareBanner(viewRef));

    act(() => {
      result.current.capture();
    });

    await waitForNextUpdate();

    expect(result.current.isGenerating).toBe(false);
    expect(result.current.bannerUri).toBe('file://mock-uri');
    expect(result.current.error).toBeNull();
  });

  it('should save to gallery when bannerUri exists', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({ id: 'mock-asset' });
    (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({ id: 'mock-album' });
    (captureRef as jest.Mock).mockResolvedValue('file://mock-uri');

    const { result, waitForNextUpdate } = renderHook(() => useShareBanner(viewRef));

    // First capture to set URI
    act(() => {
      result.current.capture();
    });

    await waitForNextUpdate();

    // Now save
    let saveSuccess;
    await act(async () => {
      saveSuccess = await result.current.save();
    });

    expect(saveSuccess).toBe(true);
    expect(MediaLibrary.createAssetAsync).toHaveBeenCalledWith('file://mock-uri');
    expect(MediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalledWith([{ id: 'mock-asset' }], 'mock-album', false);
  });

  it('should share image when sharing is available', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (captureRef as jest.Mock).mockResolvedValue('file://mock-uri');
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);

    const { result, waitForNextUpdate } = renderHook(() => useShareBanner(viewRef));

    // First capture
    act(() => {
      result.current.capture();
    });

    await waitForNextUpdate();

    await act(async () => {
      await result.current.share();
    });

    expect(Sharing.shareAsync).toHaveBeenCalledWith('file://mock-uri');
  });

  it('should set error if permissions denied', async () => {
    (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result, waitForNextUpdate } = renderHook(() => useShareBanner(viewRef));

    act(() => {
      result.current.capture();
    });

    await waitForNextUpdate();

    expect(result.current.error).toBe('Media library permission denied');
    expect(result.current.bannerUri).toBeNull();
  });
});
