/*
 * Copyright (C) 2007-2008 ARM Limited
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
 *
 */
/* ----------------------------------------------------------------
 * 
 * 
 * File Name:  armVCM4P10_CAVLCTables.h
 * OpenMAX DL: v1.0.2
 * Revision:   12290
 * Date:       Wednesday, April 9, 2008
 * 
 * 
 * 
 * 
 * Header file for optimized H.264 CALVC tables
 * 
 */
 
#ifndef ARMVCM4P10_CAVLCTABLES_H
#define ARMVCM4P10_CAVLCTABLES_H
  
/* CAVLC tables */

extern const OMX_U16 *armVCM4P10_CAVLCCoeffTokenTables[18];
extern const OMX_U16 *armVCM4P10_CAVLCTotalZeroTables[15];
extern const OMX_U16 *armVCM4P10_CAVLCTotalZeros2x2Tables[3];
extern const OMX_U16 *armVCM4P10_CAVLCRunBeforeTables[15];
extern const OMX_U8 armVCM4P10_ZigZag_4x4[16];
extern const OMX_U8 armVCM4P10_ZigZag_2x2[4];
extern const OMX_S8 armVCM4P10_SuffixToLevel[7];

#endif
