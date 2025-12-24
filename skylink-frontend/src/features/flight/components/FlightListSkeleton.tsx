import React from 'react';

interface FlightListSkeletonProps {
    count?: number;
}

const FlightListSkeleton: React.FC<FlightListSkeletonProps> = ({ count = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse"
                >
                    {/* Airline Info */}
                    <div className="flex items-start gap-4 min-w-[200px]">
                        <div className="w-12 h-12 bg-gray-200 rounded-full" />
                        <div className="flex flex-col gap-2">
                            <div className="h-3 w-16 bg-gray-200 rounded" />
                            <div className="h-5 w-24 bg-gray-200 rounded" />
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                    </div>

                    {/* Route Info */}
                    <div className="flex-1 flex items-center justify-center gap-6">
                        <div className="text-center">
                            <div className="h-7 w-14 bg-gray-200 rounded mb-2 mx-auto" />
                            <div className="h-4 w-10 bg-gray-200 rounded mx-auto" />
                        </div>

                        <div className="flex flex-col items-center min-w-[100px]">
                            <div className="h-3 w-12 bg-gray-200 rounded mb-2" />
                            <div className="w-full h-[2px] bg-gray-200" />
                        </div>

                        <div className="text-center">
                            <div className="h-7 w-14 bg-gray-200 rounded mb-2 mx-auto" />
                            <div className="h-4 w-10 bg-gray-200 rounded mx-auto" />
                        </div>
                    </div>

                    {/* Price and Action */}
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="h-7 w-20 bg-gray-200 rounded mb-1" />
                            <div className="h-3 w-12 bg-gray-200 rounded" />
                        </div>
                        <div className="h-10 w-24 bg-gray-200 rounded-lg" />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FlightListSkeleton;
