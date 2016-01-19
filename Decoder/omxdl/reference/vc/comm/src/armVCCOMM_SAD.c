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
 * File Name:  armVCCOMM_SAD.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 * Description:
 * This function will calculate SAD for NxM blocks
 * 
 */

#include "omxtypes.h"
#include "armOMX.h"
#include "omxVC.h"

#include "armCOMM.h"

/**
 * Function: armVCCOMM_SAD
 *
 * Description:
 * This function calculate the SAD for NxM blocks.
 *
 * Remarks:
 *
 * [in]		pSrcOrg		Pointer to the original block
 * [in]		iStepOrg	Step of the original block buffer
 * [in]		pSrcRef		Pointer to the reference block
 * [in]		iStepRef	Step of the reference block buffer
 * [in]		iHeight		Height of the block
 * [in]		iWidth		Width of the block
 * [out]	pDstSAD		Pointer of result SAD
 *
 * Return Value:
 * Standard OMXResult value.
 *
 */
OMXResult armVCCOMM_SAD(	
	const OMX_U8* 	pSrcOrg,
	OMX_U32 	iStepOrg,
	const OMX_U8* 	pSrcRef,
	OMX_U32 	iStepRef,
	OMX_S32*	pDstSAD,
	OMX_U32		iHeight,
	OMX_U32		iWidth
)
{
    OMX_INT     x, y;
    
    /* check for argument error */
    armRetArgErrIf(pSrcOrg == NULL, OMX_Sts_BadArgErr)
    armRetArgErrIf(pSrcRef == NULL, OMX_Sts_BadArgErr)
    armRetArgErrIf(pDstSAD == NULL, OMX_Sts_BadArgErr)
    
    *pDstSAD = 0;
    for (y = 0; y < iHeight; y++)
    {
        for (x = 0; x < iWidth; x++)
        {
            *pDstSAD += armAbs(pSrcOrg [(y * iStepOrg) + x] - 
                       pSrcRef [(y * iStepRef) + x]);
        }
    }
    
    return OMX_Sts_NoErr;
}

/*****************************************************************************
 *                              END OF FILE
 *****************************************************************************/

