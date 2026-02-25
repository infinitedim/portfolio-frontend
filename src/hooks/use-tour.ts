"use client";

import { useState, useCallback, useEffect } from "react";
import {
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_VERSION,
  type TourStep,
} from "@/components/organisms/onboarding/tour-steps";

interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  hasCompletedTour: boolean;
  isFirstVisit: boolean;
}

interface UseTourReturn {
  isActive: boolean;

  currentStep: TourStep | null;

  currentStepIndex: number;

  totalSteps: number;

  progress: number;

  hasCompletedTour: boolean;

  isFirstVisit: boolean;

  startTour: () => void;

  nextStep: () => void;

  prevStep: () => void;

  skipTour: () => void;

  completeTour: () => void;

  goToStep: (index: number) => void;

  resetTour: () => void;
}

interface StoredTourData {
  completed: boolean;
  version: string;
  completedAt?: string;
}

export function useTour(): UseTourReturn {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    hasCompletedTour: false,
    isFirstVisit: true,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(TOUR_STORAGE_KEY);
      if (stored) {
        const data: StoredTourData = JSON.parse(stored);

        if (data.version === TOUR_VERSION && data.completed) {
          setState((prev) => ({
            ...prev,
            hasCompletedTour: true,
            isFirstVisit: false,
          }));
        } else {
          setState((prev) => ({
            ...prev,
            hasCompletedTour: false,
            isFirstVisit: false,
          }));
        }
      }
    } catch (error) {
      console.warn("Failed to read tour state from localStorage:", error);
    }
  }, []);

  const saveTourState = useCallback((completed: boolean) => {
    if (typeof window === "undefined") return;

    try {
      const data: StoredTourData = {
        completed,
        version: TOUR_VERSION,
        completedAt: completed ? new Date().toISOString() : undefined,
      };
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save tour state to localStorage:", error);
    }
  }, []);

  const startTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isActive: true,
      currentStepIndex: 0,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentStepIndex + 1;
      if (nextIndex >= TOUR_STEPS.length) {
        saveTourState(true);
        return {
          ...prev,
          isActive: false,
          currentStepIndex: 0,
          hasCompletedTour: true,
        };
      }
      return {
        ...prev,
        currentStepIndex: nextIndex,
      };
    });
  }, [saveTourState]);

  const prevStep = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStepIndex: Math.max(0, prev.currentStepIndex - 1),
    }));
  }, []);

  const skipTour = useCallback(() => {
    saveTourState(true);
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: true,
    }));
  }, [saveTourState]);

  const completeTour = useCallback(() => {
    saveTourState(true);
    setState((prev) => ({
      ...prev,
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: true,
    }));
  }, [saveTourState]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TOUR_STEPS.length) {
      setState((prev) => ({
        ...prev,
        currentStepIndex: index,
      }));
    }
  }, []);

  const resetTour = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    }
    setState({
      isActive: false,
      currentStepIndex: 0,
      hasCompletedTour: false,
      isFirstVisit: true,
    });
  }, []);

  const currentStep = state.isActive
    ? TOUR_STEPS[state.currentStepIndex]
    : null;
  const progress = ((state.currentStepIndex + 1) / TOUR_STEPS.length) * 100;

  return {
    isActive: state.isActive,
    currentStep,
    currentStepIndex: state.currentStepIndex,
    totalSteps: TOUR_STEPS.length,
    progress,
    hasCompletedTour: state.hasCompletedTour,
    isFirstVisit: state.isFirstVisit,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    goToStep,
    resetTour,
  };
}
