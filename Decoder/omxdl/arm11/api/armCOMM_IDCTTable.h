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
 * 
 * File Name:  armCOMM_IDCTTable.h
 * OpenMAX DL: v1.0.2
 * Revision:   9641
 * Date:       Thursday, February 7, 2008
 * 
 * 
 * 
 *
 * File         : armCOMM_IDCTTable.h
 * Description  : Contains declarations of tables for IDCT calculation.
 *
 */
  
#ifndef _armCOMM_IDCTTable_H_
#define _armCOMM_IDCTTable_H_

#include "omxtypes.h"

     /*  Table of s(u)*A(u)*A(v)/16 at Q15
      *  s(u)=1.0 0 <= u <= 5
      *  s(6)=2.0
      *  s(7)=4.0
      *  A(0) = 2*sqrt(2)
      *  A(u) = 4*cos(u*pi/16)  for (u!=0)
	  */
extern const OMX_U16 armCOMM_IDCTPreScale [64];
extern const OMX_U16 armCOMM_IDCTCoef [4];

#endif /* _armCOMM_IDCTTable_H_ */


/* End of File */




