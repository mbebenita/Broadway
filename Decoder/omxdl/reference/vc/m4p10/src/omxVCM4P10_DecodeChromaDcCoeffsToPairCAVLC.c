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
 * File Name:  omxVCM4P10_DecodeChromaDcCoeffsToPairCAVLC.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 * H.264 decode coefficients module
 * 
 */
 
#include "omxtypes.h"
#include "armOMX.h"
#include "omxVC.h"

#include "armCOMM.h"
#include "armVC.h"

/**
 * Function:  omxVCM4P10_DecodeChromaDcCoeffsToPairCAVLC   (6.3.4.1.1)
 *
 * Description:
 * Performs CAVLC decoding and inverse raster scan for a 2x2 block of 
 * ChromaDCLevel.  The decoded coefficients in the packed position-coefficient 
 * buffer are stored in reverse zig-zag order, i.e., the first buffer element 
 * contains the last non-zero postion-coefficient pair of the block. Within 
 * each position-coefficient pair, the position entry indicates the 
 * raster-scan position of the coefficient, while the coefficient entry 
 * contains the coefficient value. 
 *
 * Input Arguments:
 *   
 *   ppBitStream - Double pointer to current byte in bit stream buffer 
 *   pOffset - Pointer to current bit position in the byte pointed to by 
 *            *ppBitStream; valid in the range [0,7]. 
 *
 * Output Arguments:
 *   
 *   ppBitStream - *ppBitStream is updated after each block is decoded 
 *   pOffset - *pOffset is updated after each block is decoded 
 *   pNumCoeff - Pointer to the number of nonzero coefficients in this block 
 *   ppPosCoefBuf - Double pointer to destination residual 
 *            coefficient-position pair buffer.  Buffer position 
 *            (*ppPosCoefBuf) is updated upon return, unless there are only 
 *            zero coefficients in the currently decoded block.  In this case 
 *            the caller is expected to bypass the transform/dequantization of 
 *            the empty blocks. 
 *
 * Return Value:
 *
 *    OMX_Sts_NoErr, if the function runs without error.
 * 
 *    OMX_Sts_BadArgErr - bad arguments: if one of the following cases occurs: 
 *    -    ppBitStream or pOffset is NULL. 
 *    -    ppPosCoefBuf or pNumCoeff is NULL. 
 *    OMX_Sts_Err - if one of the following is true: 
 *    -    an illegal code is encountered in the bitstream 
 *
 */

OMXResult omxVCM4P10_DecodeChromaDcCoeffsToPairCAVLC (
     const OMX_U8** ppBitStream,
     OMX_S32* pOffset,
     OMX_U8* pNumCoeff,
     OMX_U8** ppPosCoefbuf        
 )

{
    armRetArgErrIf(ppBitStream==NULL   , OMX_Sts_BadArgErr);
    armRetArgErrIf(*ppBitStream==NULL  , OMX_Sts_BadArgErr);
    armRetArgErrIf(pOffset==NULL       , OMX_Sts_BadArgErr);
    armRetArgErrIf(*pOffset<0          , OMX_Sts_BadArgErr);
    armRetArgErrIf(*pOffset>7          , OMX_Sts_BadArgErr);
    armRetArgErrIf(pNumCoeff==NULL     , OMX_Sts_BadArgErr);
    armRetArgErrIf(ppPosCoefbuf==NULL  , OMX_Sts_BadArgErr);
    armRetArgErrIf(*ppPosCoefbuf==NULL , OMX_Sts_BadArgErr);

    return armVCM4P10_DecodeCoeffsToPair(ppBitStream, pOffset, pNumCoeff,
                                         ppPosCoefbuf, 4, 4);

}
