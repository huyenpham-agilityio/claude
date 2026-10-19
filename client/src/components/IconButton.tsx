import type { ComponentProps } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface IconButtonProps extends ComponentProps<typeof Button> {
  // The short text shown on hover or keyboard focus. The button's own
  // aria-label stays the name screen readers announce.
  tooltip: string
}

// A button that shows only an icon, with a tooltip saying what it does.
export function IconButton({ tooltip, disabled, ...props }: IconButtonProps) {
  // A disabled button gets no pointer or focus events, so the tooltip hangs
  // off a focusable wrapper instead; this is how a disabled button can say why.
  if (disabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span tabIndex={0} className="inline-flex rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Button disabled {...props} />
          </span>
        </TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button {...props} />
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
