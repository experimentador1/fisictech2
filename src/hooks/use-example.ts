import { useState, useEffect } from 'react';

export function useExample(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Example effect
    console.log('Value changed:', value);
  }, [value]);

  const updateValue = (newValue: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setValue(newValue);
      setIsLoading(false);
    }, 1000);
  };

  return {
    value,
    setValue,
    updateValue,
    isLoading,
  };
}