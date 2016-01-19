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
/**
 * 
 * File Name:  armVCM4P2_Huff_Tables_VLC.h
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 *
 * File:        armVCM4P2_Huff_Tables.h
 * Description: Declares Tables used for Hufffman coding and decoding 
 *              in MP4P2 codec.
 *
 */
 
#ifndef _OMXHUFFTAB_H_
#define _OMXHUFFTAB_H_


extern const OMX_U16 armVCM4P2_IntraVlcL0L1[200];


extern const OMX_U16 armVCM4P2_InterVlcL0L1[200];

extern const OMX_U16 armVCM4P2_aIntraDCLumaChromaIndex[64];
//extern const OMX_U16 armVCM4P2_aIntraDCChromaIndex[32];
extern const OMX_U16 armVCM4P2_aVlcMVD[124];

extern const OMX_U8 armVCM4P2_InterL0L1LMAX[73];
extern const OMX_U8 armVCM4P2_InterL0L1RMAX[35];
extern const OMX_U8 armVCM4P2_IntraL0L1LMAX[53];
extern const OMX_U8 armVCM4P2_IntraL0L1RMAX[40]

#endif /* _OMXHUFFTAB_H_ */
