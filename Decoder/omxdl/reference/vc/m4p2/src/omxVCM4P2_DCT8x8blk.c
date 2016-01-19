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
 * File Name:  omxVCM4P2_DCT8x8blk.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 * Description:
 * Contains modules for 8x8 block DCT
 * 
 */
 
#include <math.h>
#include "omxtypes.h"
#include "armOMX.h"

#include "armCOMM.h"
#include "armVCM4P2_DCT_Table.h"

/**
 * Function:  omxVCM4P2_DCT8x8blk   (6.2.4.4.1)
 *
 * Description:
 * Computes a 2D forward DCT for a single 8x8 block, as defined in 
 * [ISO14496-2]. 
 *
 * Input Arguments:
 *   
 *   pSrc - pointer to the start of the linearly arranged input buffer; must 
 *            be aligned on a 16-byte boundary.  Input values (pixel 
 *            intensities) are valid in the range [-255,255]. 
 *
 * Output Arguments:
 *   
 *   pDst - pointer to the start of the linearly arranged output buffer; must 
 *            be aligned on a 16-byte boundary. 
 *
 * Return Value:
 *    
 *    OMX_Sts_NoErr - no error 
 *    OMX_Sts_BadArgErr - bad arguments, returned if:
 *    -    pSrc or pDst is NULL. 
 *    -    pSrc or pDst is not 16-byte aligned. 
 *
 */

OMXResult omxVCM4P2_DCT8x8blk (const OMX_S16 *pSrc, OMX_S16 *pDst)
{
    OMX_INT x, y, u, v;
    
    /* Argument error checks */
    armRetArgErrIf(pSrc == NULL, OMX_Sts_BadArgErr);
    armRetArgErrIf(!armIs16ByteAligned(pSrc), OMX_Sts_BadArgErr);
    armRetArgErrIf(pDst == NULL, OMX_Sts_BadArgErr);
    armRetArgErrIf(!armIs16ByteAligned(pDst), OMX_Sts_BadArgErr);


    for (u = 0; u < 8; u++)
    {
        for (v = 0; v < 8; v++)
        {
            OMX_F64 sum = 0.0;
            for (x = 0; x < 8; x++)
            {
                for (y = 0; y < 8; y++)
                {
                    sum += pSrc[(x * 8) + y] *
                       armVCM4P2_preCalcDCTCos[x][u] *
                       armVCM4P2_preCalcDCTCos[y][v];
                }
            }
            pDst[(u * 8) + v]= armRoundFloatToS16 (sum);            
        }
    }

    return OMX_Sts_NoErr;
}



/* End of file */


