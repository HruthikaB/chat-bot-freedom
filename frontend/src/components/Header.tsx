import { useState, useEffect, useRef } from 'react';
import { Search, MessagesSquare, Heart, ShoppingCart, X, Filter, Mic, Focus, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchProducts, fetchProductSuggestions, fetchDetailedProductSuggestions, advancedSearchProducts, searchProductsByImage, ImageSearchResponse, searchProductsByVoice } from "@/lib/api";
import { Product } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { Link } from 'react-router-dom';

type HeaderProps = {
  toggleChat: () => void;
  toggleProductsFilter?: () => void;
  onClearResults: () => void;
  onSearchResults: (products: Product[]) => void;
  onImageSearchResults?: (imageResults: Array<{
    product: Product;
    similarity_score: number;
    match_type: string;
  }>) => void;
  onImageSearchStart?: () => void;
};

const Header = ({ 
  toggleChat, 
  toggleProductsFilter, 
  onClearResults,
  onSearchResults,
  onImageSearchResults,
  onImageSearchStart
}: HeaderProps) => {
  const { cart } = useCart();
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isRecordingStarted, setIsRecordingStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [detailedSuggestions, setDetailedSuggestions] = useState<Product[]>([]);
  const debounceTimeout = useRef<any>(null);
  const justSelectedSuggestion = useRef(false);
  const [showImageSearchPopup, setShowImageSearchPopup] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const RECORD_SECONDS = 4; // 3-5 seconds, set to 4 for balance

  const performSearch = async (text: string) => {
    if (!text.trim()) {
      onClearResults();
      return;
    }
    
    try {
      setIsSearching(true);
      
      const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(text);
      
      let results: Product[];
      if (hasLogicalOperators) {
        results = await advancedSearchProducts(text);
      } else {
        results = await searchProducts(text);
      }

      if (results && Array.isArray(results) && results.length > 0) {
        onSearchResults(results);
      } else {
        onSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      onClearResults();
    } finally {
      setIsSearching(false);
    }
  };

  const performVoiceSearch = async (audioBlob: Blob) => {
    try {
      setIsVoiceSearching(true);
      
      const mimeType = audioBlob.type;
      let extension = 'webm';
      
      if (mimeType.includes('webm')) {
        extension = 'webm';
      } else if (mimeType.includes('mp4')) {
        extension = 'mp4';
      } else if (mimeType.includes('ogg')) {
        extension = 'ogg';
      }
      
      const audioFile = new File([audioBlob], `voice_search.${extension}`, { type: mimeType });
      
      const response = await searchProductsByVoice(audioFile);
      
      if (response.products && response.products.length > 0) {
        onSearchResults(response.products);
        setSearchText(response.converted_text || '');
        
        const convertedText = response.converted_text || 'your search';
      } else {
        onSearchResults([]);
        setSearchText(response.converted_text || '');
        
        const convertedText = response.converted_text || 'your search';
      }
    } catch (error) {
      console.error('Voice search error:', error);
      alert('Voice search failed. Please try speaking more clearly.');
      onClearResults();
    } finally {
      setIsVoiceSearching(false);
      setShowVoicePopup(false);
    }
  };

  const startRecording = async () => {
    try {
      setShowVoicePopup(true);
      setRecordingTime(0);
      setIsRecordingStarted(false);
      // Start recording immediately
      await beginRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      setShowVoicePopup(false);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Unable to access microphone: ${error.message}`);
        }
      } else {
        alert('Unable to access microphone. Please check permissions.');
      }
    }
  };

  const beginRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg'
      ];
      
      let mimeType = null;
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }
      
      if (!mimeType) {
        throw new Error('No supported audio format found');
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        performVoiceSearch(audioBlob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start(200); // timeslice: get first chunk quickly
      setIsRecording(true);
      setIsRecordingStarted(true);
      setRecordingTime(0);
      let seconds = 0;
      const timer = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
        if (seconds >= RECORD_SECONDS) {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.requestData(); // flush buffer
            mediaRecorder.stop();
            setIsRecording(false);
            setIsRecordingStarted(false);
          }
          clearInterval(timer);
        }
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      setShowVoicePopup(false);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert('Microphone access denied. Please allow microphone permissions and try again.');
        } else if (error.name === 'NotFoundError') {
          alert('No microphone found. Please connect a microphone and try again.');
        } else {
          alert(`Unable to access microphone: ${error.message}`);
        }
      } else {
        alert('Unable to access microphone. Please check permissions.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingStarted(false);
      setShowVoicePopup(false);
    }
  };

  const closeVoicePopup = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingStarted(false);
    }
    setShowVoicePopup(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const performImageSearch = async (imageFile: File) => {
    try {
      const response: ImageSearchResponse = await searchProductsByImage(imageFile);

      if (response.products && response.products.length > 0) {
        if (onImageSearchResults) {
          onImageSearchResults(response.products);
        } else {
          const products = response.products.map(item => item.product);
          onSearchResults(products);
        }
        
        setSearchText('');
      } else {
        if (onImageSearchResults) {
          onImageSearchResults([]);
        } else {
          onSearchResults([]);
        }
        setSearchText('');
      }
    } catch (error) {
      console.error('Image search error:', error);
      onClearResults();
      setSearchText('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPEG, PNG, etc.)');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size must be less than 10MB');
        return;
      }
      
      if (onImageSearchStart) {
        onImageSearchStart();
      }
      
      performImageSearch(file);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFocusClick = () => {
    fileInputRef.current?.click();
  };

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    setShowSuggestions(!!value);

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    if (!value.trim()) {
      setSuggestions([]);
      setDetailedSuggestions([]);
      return;
    }

    debounceTimeout.current = setTimeout(async () => {
      try {
        // Always fetch suggestions for any input
        const suggs = await fetchProductSuggestions(value);
        setSuggestions(suggs);
      } catch (error) {
        setSuggestions([]);
      }
    }, 200);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchText.trim()) {
      await performSearch(searchText);
      setShowSuggestions(false);
    } else if (e.key === ' ' && !isRecording && !isVoiceSearching) {
      e.preventDefault();
      handleMicClick();
    }
  };

  const handleClearSearch = () => {
    setSearchText('');
    setSuggestions([]);
    setDetailedSuggestions([]);
    setShowSuggestions(false);
    onClearResults();
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (justSelectedSuggestion.current) {
      justSelectedSuggestion.current = false;
      return;
    }
    if (searchText.trim()) {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = setTimeout(async () => {
        const hasLogicalOperators = /(AND|OR|IN|NOT|\(|\))/i.test(searchText);
        
        if (hasLogicalOperators) {
          const detailedSuggs = await fetchDetailedProductSuggestions(searchText);
          setDetailedSuggestions(detailedSuggs);
          setSuggestions([]);
          setShowSuggestions(true);
        } else {
          const suggs = await fetchProductSuggestions(searchText);
          setSuggestions(suggs);
          setDetailedSuggestions([]);
          setShowSuggestions(true);
        }
      }, 250);
    } else {
      setSuggestions([]);
      setDetailedSuggestions([]);
      setShowSuggestions(false);
    }
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [searchText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(target)) {
        setShowSuggestions(false);
        setSuggestions([]);
        setDetailedSuggestions([]);
        setIsFocused(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  const handleSuggestionClick = async (suggestion: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    justSelectedSuggestion.current = true;
    setShowSuggestions(false);
    setSuggestions([]);
    setDetailedSuggestions([]);
    
    setSearchText(suggestion);
    
    await performSearch(suggestion);
  };

  // Image search icon click handler
  const handleImageIconClick = () => {
    setShowImageSearchPopup(true);
  };

  // Upload from device
  const handleUploadFromDevice = () => {
    setShowImageSearchPopup(false);
    fileInputRef.current?.click();
  };

  // Camera logic
  const handleTakePhotoWithCamera = async () => {
    setShowImageSearchPopup(false);
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
    } catch (err) {
      alert('Unable to access camera. Please check permissions.');
      setShowCameraModal(false);
    }
  };

  useEffect(() => {
    if (showCameraModal && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
      setIsVideoReady(false);
    }
    if (!showCameraModal && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsVideoReady(false);
    }
  }, [showCameraModal, cameraStream]);

  const handleVideoLoaded = () => {
    setIsVideoReady(true);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (blob) {
            setCapturedPhoto(blob);
          }
        }, 'image/jpeg');
      }
    }
  };

  const handleUseCapturedPhoto = () => {
    if (capturedPhoto) {
      setShowCameraModal(false);
      setCapturedPhoto(null);
      performImageSearch(new File([capturedPhoto], 'captured_photo.jpg', { type: 'image/jpeg' }));
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
  };

  const handleCloseCameraModal = () => {
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-shop-darkPurple border-b fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-8">
        <a href="/" className="text-shop-purple text-2xl font-bold font-sans">shop</a>
        <nav className="flex gap-6">
          <a href="/" className="text-white hover:text-shop-purple">Home</a>
          <a href="/explore" className="text-white hover:text-shop-purple">Explore</a>
        </nav>
      </div>
      
      <div className="relative flex-1 max-w-xl mx-8 search-container">
        <div className="relative">
          {isSearching ? (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
            </div>
          ) : (
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          )}
          <Input 
            ref={inputRef}
            type="text" 
            placeholder="Search products..."
            value={searchText}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
            }}
            className="pl-10 pr-10 py-2 w-full rounded-full bg-gray-100 border-none"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-3 pr-2">
            <div className="relative group">
              {isRecording ? (
                <div className="flex items-center">
                  <MicOff
                    className="text-red-500 h-5 w-5 cursor-pointer hover:text-red-600 animate-pulse"
                    onClick={handleMicClick}
                  />

                </div>
              ) : isVoiceSearching ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                  <div className="ml-2 text-xs text-gray-500">
                    Processing...
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <Mic
                    className="text-gray-400 h-5 w-5 cursor-pointer hover:text-gray-600"
                    onClick={handleMicClick}
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Voice search
                  </div>
                </div>
              )}
            </div>
            
            {searchText && (
              <div className="relative group">
                <button 
                  className="text-gray-400 h-5 w-5 hover:text-gray-600" 
                  onClick={handleClearSearch}
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  Clear search
                </div>
              </div>
            )}
            <div className="relative group">
              <Focus
                className="h-5 w-5 cursor-pointer transition-colors text-gray-400 hover:text-gray-600"
                onClick={handleImageIconClick}
              />
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {showSuggestions && (suggestions.length > 0 || detailedSuggestions.length > 0) && (
            <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-56 overflow-y-auto">
              {detailedSuggestions.length > 0 ? (
                detailedSuggestions.map((product, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => handleSuggestionClick(product.name, e)}
                  >
                    {product.name}
                  </li>
                ))
              ) : (
                suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                    onMouseDown={(e) => handleSuggestionClick(suggestion, e)}
                  >
                    {suggestion}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>
      
      {/* Voice Search Popup */}
      {showVoicePopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-200 opacity-100">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl relative animate-fade-in">
            {/* Close button */}
            <button
              onClick={closeVoicePopup}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="text-center">
              {isVoiceSearching ? (
                <>
                  <div className="mb-6">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing...</h3>
                    <p className="text-gray-600">Converting your voice to text and searching products</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="relative w-24 h-24 mx-auto mb-4">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <Mic className="h-8 w-8 text-red-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Recording...</h3>
                    <p className="text-gray-600 mb-4">Speak clearly into your microphone</p>
                    <div className="flex space-x-2 justify-center mb-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <div className="text-lg font-bold text-gray-700">{RECORD_SECONDS - recordingTime}s</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Image Search Popup */}
      {showImageSearchPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-4 p-0"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl px-6 py-8 flex flex-col items-center transition-all duration-300 ease-out border border-gray-100"
              style={{ minWidth: 0 }}
            >
            <button
              onClick={() => setShowImageSearchPopup(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-shop-purple transition-colors focus:outline-none focus:ring-2 focus:ring-shop-purple rounded-full"
                aria-label="Close image search popup"
            >
              <X className="h-6 w-6" />
            </button>
              <h3 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight text-center" style={{ letterSpacing: '-0.01em' }}>
                Image Search
              </h3>
              <Button
                className="w-full mb-4 py-3 text-base font-semibold rounded-xl bg-shop-purple hover:bg-shop-purple/90 text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shop-purple"
                onClick={handleUploadFromDevice}
              >
              Upload from Device
            </Button>
              <Button
                className="w-full py-3 text-base font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-shop-purple border border-gray-200 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shop-purple"
                onClick={handleTakePhotoWithCamera}
              >
              Take Photo with Camera
            </Button>
              <div className="mt-6 w-full flex flex-col items-center">
                <span className="text-xs text-gray-400 text-center">We respect your privacy. Images are processed securely.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm animate-fade-in">
          <div
            className="relative w-full max-w-xs sm:max-w-sm md:max-w-md mx-4 p-0"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl px-6 py-8 flex flex-col items-center transition-all duration-300 ease-out border border-gray-100"
              style={{ minWidth: 0 }}
            >
            <button
              onClick={handleCloseCameraModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-shop-purple transition-colors focus:outline-none focus:ring-2 focus:ring-shop-purple rounded-full"
                aria-label="Close camera modal"
            >
              <X className="h-6 w-6" />
            </button>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 tracking-tight text-center" style={{ letterSpacing: '-0.01em' }}>
                Take Photo
              </h3>
            {/* Always render the hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />
            {!capturedPhoto ? (
              <>
                  <video
                    ref={videoRef}
                    className="w-full rounded-xl mb-4 border border-gray-200 shadow-sm aspect-video bg-gray-50"
                    autoPlay
                    playsInline
                    onLoadedMetadata={handleVideoLoaded}
                  />
                  <Button
                    className="w-full py-3 text-base font-semibold rounded-xl bg-shop-purple hover:bg-shop-purple/90 text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shop-purple"
                    onClick={handleCapturePhoto}
                    disabled={!isVideoReady}
                  >
                  {isVideoReady ? 'Capture' : 'Loading...'}
                </Button>
              </>
            ) : (
              <>
                <img
                  src={URL.createObjectURL(capturedPhoto)}
                  alt="Captured"
                    className="w-full rounded-xl mb-4 border border-gray-200 shadow-sm aspect-video object-cover"
                />
                <div className="flex w-full gap-2">
                    <Button
                      className="flex-1 py-3 text-base font-semibold rounded-xl bg-shop-purple hover:bg-shop-purple/90 text-white shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shop-purple"
                      onClick={handleUseCapturedPhoto}
                    >
                    Use Photo
                  </Button>
                    <Button
                      className="flex-1 py-3 text-base font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-shop-purple border border-gray-200 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-shop-purple"
                      variant="outline"
                      onClick={handleRetakePhoto}
                    >
                    Retake
                  </Button>
                </div>
              </>
            )}
              <div className="mt-6 w-full flex flex-col items-center">
                <span className="text-xs text-gray-400 text-center">We respect your privacy. Images are processed securely.</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-white/10"
          onClick={toggleProductsFilter}
        >
          <Filter className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full hover:bg-white/10"
          onClick={toggleChat}
        >
          <MessagesSquare className="h-7.5 w-7.5 text-shop-purple" />
        </Button>
        <Link to="/wishlist">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
            <Heart className="h-7.5 w-7.5 text-shop-purple" />
          </Button>
        </Link>
        <Link to="/cart">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
            <ShoppingCart className="h-7.5 w-7.5 text-shop-purple" />
            {cart.totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cart.totalItems > 99 ? '99+' : cart.totalItems}
              </span>
            )}
          </Button>
        </Link>
        <Button 
          className="bg-shop-purple hover:bg-shop-purple/90 text-white rounded-full px-6 py-1 h-9"
        >
          Sign in
        </Button>
      </div>
    </header>
  );
};

export default Header;