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
 * File Name:  armVCM4P2_CompareMV.c
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 * 
 * Description:
 * Contains module for comparing motion vectors and SAD's to decide 
 * the best MV and SAD
 *
 */
  
#include "omxtypes.h"
#include "armOMX.h"

#include "armVC.h"
#include "armCOMM.h"

/**
 * Function: armVCM4P2_CompareMV
 *
 * Description:
 * Performs comparision of motion vectors and SAD's to decide the 
 * best MV and SAD
 *
 * Remarks:
 *
 * Parameters:
 * [in]	    mvX		x coordinate of the candidate motion vector
 * [in]	    mvY		y coordinate of the candidate motion vector
 * [in]	    candSAD	Candidate SAD
 * [in]	    bestMVX	x coordinate of the best motion vector
 * [in]	    bestMVY	y coordinate of the best motion vector
 * [in]	    bestSAD	best SAD
 *
 * Return Value:
 * OMX_INT -- 1 to indicate that the current sad is the best 
 *            0 to indicate that it is NOT the best SAD
 */

OMX_INT armVCM4P2_CompareMV (
    OMX_S16 mvX, 
    OMX_S16 mvY, 
    OMX_INT candSAD, 
    OMX_S16 bestMVX, 
    OMX_S16 bestMVY, 
    OMX_INT bestSAD
) 
{
    if (candSAD < bestSAD)
    {
        return 1;
    }
    if (candSAD > bestSAD)
    {
        return 0;
    }
    /* shorter motion vector */
    if ( (mvX * mvX + mvY * mvY) < (bestMVX*bestMVX+bestMVY*bestMVY) )
    {
         return 1;
    }
    return 0;
}

/*End of File*/
