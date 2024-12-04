/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import {build} from '../lib/params.js';

const isEndorsed = (['santatracker.google.com', 'maps.gstatic.com'].indexOf(location.hostname) !== -1);

const mapsClient = isEndorsed ? 'google-santa-tracker' : '';
const apiKey = isEndorsed ? '' : 'AIzaSyCd10wMb551oDwcH7tVZRBPifMh6MQpnpU';  // for localhost, testing

const mapsApiURLBase = 'https://maps.googleapis.com/maps/api/js';
const callbackName = '__$global_santa_maps_callback_' + Math.random().toString(16).slice(2);

function mapsApiURL() {
  const params = {
    'callback': callbackName,
    'v': '3.exp',
    'libraries': 'drawing,geometry',
    'use_slippy': true,
  };
  if (document.documentElement.lang) {
    params['language'] = document.documentElement.lang;
  }
  if (mapsClient) {
    params['client'] = mapsClient;
  }
  if (apiKey) {
    params['key'] = apiKey;
  }
  return mapsApiURLBase + build(params);
}

let mapsPromise = null;

export default function load() {
  if (mapsPromise === null) {
    mapsPromise = internalLoad();
  }
  return mapsPromise;
}

async function internalLoad() {
  const p = new Promise((resolve, reject) => {
    window[callbackName] = resolve;
    const script = document.createElement('script');
    script.src = mapsApiURL();
    script.onerror = reject;
    document.head.appendChild(script);
  });

  try {
    await p;
    return window['google']['maps'];
  } finally {
    delete window[callbackName];
  }
}
