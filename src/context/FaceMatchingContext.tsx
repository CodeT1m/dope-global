import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PhotoMatch {
    id: string;
    file_url: string;
    distance?: number;
}

interface FaceMatchingContextType {
    capturedImage: string | null;
    setCapturedImage: (image: string | null) => void;
    matches: PhotoMatch[];
    setMatches: (matches: PhotoMatch[]) => void;
    isSearching: boolean;
    setIsSearching: (isSearching: boolean) => void;
    selectedPhotos: string[];
    setSelectedPhotos: (photos: string[] | ((prev: string[]) => string[])) => void;
}

const FaceMatchingContext = createContext<FaceMatchingContextType | undefined>(undefined);

export const FaceMatchingProvider = ({ children }: { children: ReactNode }) => {
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [matches, setMatches] = useState<PhotoMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

    return (
        <FaceMatchingContext.Provider
            value={{
                capturedImage,
                setCapturedImage,
                matches,
                setMatches,
                isSearching,
                setIsSearching,
                selectedPhotos,
                setSelectedPhotos,
            }}
        >
            {children}
        </FaceMatchingContext.Provider>
    );
};

export const useFaceMatching = () => {
    const context = useContext(FaceMatchingContext);
    if (context === undefined) {
        throw new Error('useFaceMatching must be used within a FaceMatchingProvider');
    }
    return context;
};
