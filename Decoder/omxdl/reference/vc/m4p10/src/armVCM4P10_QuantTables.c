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
 * File Name:  armVCM4P10_QuantTables.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 * H.264 inverse quantize tables
 * 
 */
 
#include "omxtypes.h"
#include "armOMX.h"
#include "omxVC.h"

#include "armVC.h"

const OMX_U32 armVCM4P10_MFMatrix[6][3] =
{
    {13107, 5243, 8066},
    {11916, 4660, 7490},
    {10082, 4194, 6554},
    { 9362, 3647, 5825},
    { 8192, 3355, 5243},
    { 7282, 2893, 4559}
}; 
