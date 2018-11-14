import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { services } from './services/index';

import { interceptors } from './http-interceptors/index';

import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';

import { effects } from './store/effects/index';
import {
  reducerToken,
  reducerProvider,
  metaReducers
} from './store/reducers/index';
import { AuthModuleConfig, defaultAuthModuleConfig } from './config/config';
import { Config, ConfigModule } from '../config/config.module';
import { RoutingModule } from '../routing/routing.module';


@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    RoutingModule,
    StoreModule.forFeature('auth', reducerToken, { metaReducers }),
    EffectsModule.forFeature(effects),
    ConfigModule.withConfig(defaultAuthModuleConfig)
  ],
  providers: [
    ...services,
    ...interceptors,
    reducerProvider,
    { provide: AuthModuleConfig, useExisting: Config }
  ]
})
export class AuthModule {}
