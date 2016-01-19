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
 * File Name:  armVCCOMM_Average.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 * Description:
 * This function will calculate Average of two blocks if size iWidth X iHeight
 * 
 */

#include "omxtypes.h"
#include "armOMX.h"
#include "omxVC.h"

#include "armCOMM.h"
#include "armVC.h"

/**
 * Function: armVCCOMM_Average
 *
 * Description:
 * This function calculates the average of two blocks and stores the result.
 *
 * Remarks:
 *
 *	[in]	pPred0			Pointer to the top-left corner of reference block 0
 *	[in]	pPred1			Pointer to the top-left corner of reference block 1
 *	[in]	iPredStep0	    Step of reference block 0
 *	[in]	iPredStep1	    Step of reference block 1
 *	[in]	iDstStep 		Step of the destination buffer
 *	[in]	iWidth			Width of the blocks
 *	[in]	iHeight			Height of the blocks
 *	[out]	pDstPred		Pointer to the destination buffer
 *
 * Return Value:
 * Standard OMXResult value.
 *
 */
 OMXResult armVCCOMM_Average (
	 const OMX_U8* 	    pPred0,
	 const OMX_U8* 	    pPred1,	
	 OMX_U32		iPredStep0,
	 OMX_U32		iPredStep1,
	 OMX_U8*		pDstPred,
	 OMX_U32		iDstStep, 
	 OMX_U32		iWidth,
	 OMX_U32		iHeight
)
{
    OMX_U32     x, y;

    /* check for argument error */
    armRetArgErrIf(pPred0 == NULL, OMX_Sts_BadArgErr)
    armRetArgErrIf(pPred1 == NULL, OMX_Sts_BadArgErr)
    armRetArgErrIf(pDstPred == NULL, OMX_Sts_BadArgErr)

    for (y = 0; y < iHeight; y++)
    {
        for (x = 0; x < iWidth; x++)
        {
            pDstPred [y * iDstStep + x] = 
                (OMX_U8)(((OMX_U32)pPred0 [y * iPredStep0 + x] + 
                                  pPred1 [y * iPredStep1 + x] + 1) >> 1);
        }
    }

    return OMX_Sts_NoErr;
}

/*****************************************************************************
 *                              END OF FILE
 *****************************************************************************/

