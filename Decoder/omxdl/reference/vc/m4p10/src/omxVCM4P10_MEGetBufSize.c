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
 * File Name:  omxVCM4P10_MEGetBufSize.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 * Description:
 * Initialization modules for the vendor specific Motion Estimation structure.
 * 
 */

#include "omxtypes.h"
#include "armOMX.h"
#include "omxVC.h"

#include "armVC.h"
#include "armCOMM.h"

/**
 * Function:  omxVCM4P10_MEGetBufSize   (6.3.5.1.1)
 *
 * Description:
 * Computes the size, in bytes, of the vendor-specific specification 
 * structure for the omxVCM4P10 motion estimation functions BlockMatch_Integer 
 * and MotionEstimationMB. 
 *
 * Input Arguments:
 *   
 *   MEmode - motion estimation mode; available modes are defined by the 
 *            enumerated type OMXVCM4P10MEMode 
 *   pMEParams -motion estimation parameters 
 *
 * Output Arguments:
 *   
 *   pSize - pointer to the number of bytes required for the motion 
 *            estimation specification structure 
 *
 * Return Value:
 *    OMX_Sts_NoErr, if the function runs without error.
 *    OMX_Sts_BadArgErr - bad arguments: if one of the following cases occurs: 
 *    -    pMEParams or pSize is NULL. 
 *    -    an invalid MEMode is specified. 
 *
 */

OMXResult omxVCM4P10_MEGetBufSize(
    OMXVCM4P10MEMode MEMode,
    const OMXVCM4P10MEParams *pMEParams,
    OMX_U32 *pSize
    )
{
    armRetArgErrIf(!pMEParams, OMX_Sts_BadArgErr);
    armRetArgErrIf(!pSize, OMX_Sts_BadArgErr);
    armRetArgErrIf((MEMode != OMX_VC_M4P10_FAST_SEARCH) && 
                   (MEMode != OMX_VC_M4P10_FULL_SEARCH), OMX_Sts_BadArgErr);
    armRetArgErrIf((pMEParams->searchRange16x16 <= 0) || 
                   (pMEParams->searchRange8x8 <= 0) || 
                   (pMEParams->searchRange4x4 <= 0), OMX_Sts_BadArgErr);
                   
    *pSize = (OMX_INT) sizeof(ARMVCM4P10_MESpec);
    
    return OMX_Sts_NoErr;
}

/* End of file */
