#include "config.h"

#if HAVE_ASM
#if ARCH_AARCH64
#include "src/arm/64/ipred16.S"
#endif
#if ARCH_ARM
#include "src/arm/32/ipred16.S"
#endif
#endif
