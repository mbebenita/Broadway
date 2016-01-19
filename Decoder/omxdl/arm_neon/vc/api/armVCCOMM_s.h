;//
;// Copyright (C) 2007-2008 ARM Limited
;//
;// Licensed under the Apache License, Version 2.0 (the "License");
;// you may not use this file except in compliance with the License.
;// You may obtain a copy of the License at
;//
;//      http://www.apache.org/licenses/LICENSE-2.0
;//
;// Unless required by applicable law or agreed to in writing, software
;// distributed under the License is distributed on an "AS IS" BASIS,
;// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
;// See the License for the specific language governing permissions and
;// limitations under the License.
;//
;//
;// 
;// File Name:  armVCCOMM_s.h
;// OpenMAX DL: v1.0.2
;// Revision:   12290
;// Date:       Wednesday, April 9, 2008
;// 
;// 
;// 
;//
;// ARM optimized OpenMAX AC header file
;// 
;// Formula used:
;// MACRO for calculating median for three values.



    IF :LNOT::DEF:ARMVCCOMM_S_H
        INCLUDE armCOMM_s.h
    M_VARIANTS      CortexA8, ARM1136JS
    
    IF ARM1136JS :LOR: CortexA8 
     
     ;///*
     ;// * Macro: M_MEDIAN3
     ;// *
     ;// * Description: Finds the median of three numbers
     ;// * 
     ;// * Remarks:
     ;// *
     ;// * Parameters:
     ;// * [in] x     First entry for the list of three numbers.
     ;// * [in] y     Second entry for the list of three numbers.
     ;// *            Input value may be corrupted at the end of
     ;// *            the execution of this macro.
     ;// * [in] z     Third entry of the list of three numbers.
     ;// *            Input value corrupted at the end of the 
     ;// *            execution of this macro.
     ;// * [in] t     Temporary scratch  register.
     ;// * [out]z     Median of the three numbers.       
     ;// */
     
     MACRO

     M_MEDIAN3 $x, $y, $z, $t 
     
     SUBS  $t, $y, $z; // if (y < z)
     ADDLT $z, $z, $t; //  swap y and z
     SUBLT $y, $y, $t;

     ;// Now z' <= y', so there are three cases for the
     ;// median value, depending on x.

     ;// 1) x <= z'      <= y'      : median value is z'
     ;// 2)      z' <= x <= y'      : median value is x
     ;// 3)      z'      <= y' <= x : median value is y'

     CMP   $z, $x;     // if ( x > min(y,z) )
     MOVLT $z, $x;     // ans = x 

     CMP   $x, $y;     // if ( x > max(y,z) )
     MOVGT $z, $y;     // ans = max(y,z)
     
     MEND
    ENDIF      
    
    
        
    ENDIF ;// ARMACCOMM_S_H

 END
