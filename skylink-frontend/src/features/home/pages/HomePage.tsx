import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchForm, type SearchParams } from '@/features/flight';
import { useAuth } from '@/features/auth';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [origin, setOrigin] = useState('PEK');
  const [destination, setDestination] = useState('SHA');

  const handleSearch = (params: SearchParams) => {
    const queryString = new URLSearchParams();
    queryString.append('origin', params.segments[0].origin);
    queryString.append('destination', params.segments[0].destination);
    queryString.append('date', params.segments[0].date);
    navigate(`/results?${queryString.toString()}`, { state: { searchParams: params } });
  };

  const handleAiRequest = () => {
    if (!user) navigate('/login');
    else {
      window.dispatchEvent(new CustomEvent('open-ai-modal'));
    }
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div
        className="h-[500px] bg-cover bg-center relative flex items-center justify-center transition-all duration-700"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop")' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 via-transparent to-slate-900/70 dark:from-black/70 dark:via-black/60 dark:to-black/80" />
        <div className="relative z-10 text-center text-white -mt-20 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg tracking-tight">
            探索世界，智享旅程
          </h1>
          <p className="text-lg md:text-xl opacity-90 font-light tracking-wide">
            智能航班搜索平台
          </p>
        </div>
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
        <SearchForm
          onSearch={handleSearch}
          onAiRequest={handleAiRequest}
          isAiLoading={false}
          origin={origin}
          setOrigin={setOrigin}
          destination={destination}
          setDestination={setDestination}
          compact={false}
        />
      </div>
    </div>
  );
};

export default HomePage;
