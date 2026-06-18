import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useBookingStore } from './store/useBookingStore';
import './app.scss';

function App(props) {
  useEffect(() => {
    useBookingStore.getState().startTick();
  }, []);

  useDidShow(() => {
    useBookingStore.getState().startTick();
  });

  useDidHide(() => {});

  return props.children;
}

export default App;
