import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteDict } from '@/features/flight/api/routes';
import type { RouteDictItem } from '@/features/flight/api/routes';
import type { CityDictItem } from '@/features/admin/dashboard/map';

export type ChangeType = 'ADDED' | 'UPDATED' | 'REMOVED';

export type RouteChange = {
  routeId: number;
  type: ChangeType;
  data?: RouteDictItem;
  prevData?: RouteDictItem;
};

export type CityChange = {
  cityName: string;
  type: ChangeType;
  data?: CityDictItem;
  prevData?: CityDictItem;
};

export type MapDataDiff = {
  version: string;
  routes: RouteChange[];
  cities: CityChange[];
};

function generateHash(obj: any): string {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function compareRouteDictItems(oldItem: RouteDictItem, newItem: RouteDictItem): boolean {
  return (
    oldItem.departureCity === newItem.departureCity &&
    oldItem.departureAirport === newItem.departureAirport &&
    oldItem.arrivalCity === newItem.arrivalCity &&
    oldItem.arrivalAirport === newItem.arrivalAirport &&
    oldItem.estimatedDuration === newItem.estimatedDuration &&
    oldItem.distanceKm === newItem.distanceKm &&
    (oldItem as any).orderCount === (newItem as any).orderCount &&
    (oldItem as any).gmv === (newItem as any).gmv &&
    (oldItem as any).onTimeRate === (newItem as any).onTimeRate &&
    (oldItem as any).avgPrice === (newItem as any).avgPrice &&
    (oldItem as any).activeFlights === (newItem as any).activeFlights &&
    (oldItem as any).routeLevel === (newItem as any).routeLevel
  );
}

function compareCityDictItems(oldItem: CityDictItem, newItem: CityDictItem): boolean {
  return (
    oldItem.mainAirport === newItem.mainAirport &&
    oldItem.dailyDepartures === newItem.dailyDepartures &&
    oldItem.weeklyGmv === newItem.weeklyGmv &&
    oldItem.currentLoad === newItem.currentLoad &&
    oldItem.alertLevel === newItem.alertLevel
  );
}

function calculateRouteDiff(
  oldRoutes: RouteDictItem[],
  newRoutes: RouteDictItem[],
): RouteChange[] {
  const changes: RouteChange[] = [];
  const oldMap = new Map<number, RouteDictItem>();
  const newMap = new Map<number, RouteDictItem>();

  oldRoutes.forEach(r => oldMap.set(r.routeId, r));
  newRoutes.forEach(r => newMap.set(r.routeId, r));

  oldMap.forEach((oldItem, routeId) => {
    const newItem = newMap.get(routeId);
    if (!newItem) {
      changes.push({ routeId, type: 'REMOVED', prevData: oldItem });
    } else if (!compareRouteDictItems(oldItem, newItem)) {
      changes.push({ routeId, type: 'UPDATED', data: newItem, prevData: oldItem });
    }
  });

  newMap.forEach((newItem, routeId) => {
    if (!oldMap.has(routeId)) {
      changes.push({ routeId, type: 'ADDED', data: newItem });
    }
  });

  return changes;
}

function calculateCityDiff(
  oldCities: CityDictItem[],
  newCities: CityDictItem[],
): CityChange[] {
  const changes: CityChange[] = [];
  const oldMap = new Map<string, CityDictItem>();
  const newMap = new Map<string, CityDictItem>();

  oldCities.forEach(c => oldMap.set(c.cityName, c));
  newCities.forEach(c => newMap.set(c.cityName, c));

  oldMap.forEach((oldItem, cityName) => {
    const newItem = newMap.get(cityName);
    if (!newItem) {
      changes.push({ cityName, type: 'REMOVED', prevData: oldItem });
    } else if (!compareCityDictItems(oldItem, newItem)) {
      changes.push({ cityName, type: 'UPDATED', data: newItem, prevData: oldItem });
    }
  });

  newMap.forEach((newItem, cityName) => {
    if (!oldMap.has(cityName)) {
      changes.push({ cityName, type: 'ADDED', data: newItem });
    }
  });

  return changes;
}

export function useMapDataIncremental(refreshInterval = 30000) {
  const queryClient = useQueryClient();

  const routesQuery = useQuery({
    queryKey: ['routeDict'],
    queryFn: async () => {
      const response = await getRouteDict();
      return response.routes;
    },
    refetchInterval: refreshInterval,
    staleTime: 0,
  });

  const citiesQuery = useQuery({
    queryKey: ['cityDict'],
    queryFn: async () => {
      const response = await fetch('/api/v1/flight/cities/dict');
      const data = await response.json() as CityDictItem[];
      return data;
    },
    refetchInterval: refreshInterval,
    staleTime: 0,
  });

  const diff = React.useMemo<MapDataDiff | null>(() => {
    const oldRoutes = queryClient.getQueryData<RouteDictItem[]>(['routeDict', 'prev']);
    const oldCities = queryClient.getQueryData<CityDictItem[]>(['cityDict', 'prev']);
    const newRoutes = routesQuery.data;
    const newCities = citiesQuery.data;

    if (!newRoutes || !newCities) return null;

    const routesChanges = oldRoutes ? calculateRouteDiff(oldRoutes, newRoutes) : [];
    const citiesChanges = oldCities ? calculateCityDiff(oldCities, newCities) : [];

    const version = generateHash({ routes: newRoutes, cities: newCities });

    if (routesChanges.length === 0 && citiesChanges.length === 0 && oldRoutes && oldCities) {
      return null;
    }

    return {
      version,
      routes: routesChanges,
      cities: citiesChanges,
    };
  }, [routesQuery.data, citiesQuery.data, queryClient]);

  React.useEffect(() => {
    if (routesQuery.data && routesQuery.isSuccess) {
      queryClient.setQueryData(['routeDict', 'prev'], routesQuery.data);
    }
  }, [routesQuery.data, routesQuery.isSuccess, queryClient]);

  React.useEffect(() => {
    if (citiesQuery.data && citiesQuery.isSuccess) {
      queryClient.setQueryData(['cityDict', 'prev'], citiesQuery.data);
    }
  }, [citiesQuery.data, citiesQuery.isSuccess, queryClient]);

  return {
    routes: routesQuery.data ?? [],
    cities: citiesQuery.data ?? [],
    diff,
    isLoading: routesQuery.isLoading || citiesQuery.isLoading,
    isError: routesQuery.isError || citiesQuery.isError,
    error: routesQuery.error || citiesQuery.error,
  };
}
