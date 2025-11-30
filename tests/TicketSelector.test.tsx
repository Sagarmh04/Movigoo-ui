import { fireEvent, render, screen } from "@testing-library/react";
import TicketSelector from "@/components/TicketSelector";
import type { TicketType } from "@/types/event";

const tickets: TicketType[] = [
  {
    id: "vip",
    name: "VIP",
    price: 5000,
    available: 2,
    maxPerOrder: 2,
    perks: "Front row"
  }
];

describe("TicketSelector", () => {
  it("respects max per order and availability", () => {
    const handleChange = jest.fn();
    render(<TicketSelector tickets={tickets} value={{}} onChange={handleChange} />);
    const increase = screen.getByLabelText(/Increase VIP/i);
    fireEvent.click(increase);
    expect(handleChange).toHaveBeenCalled();
  });

  it("disables increment when max reached", () => {
    const { rerender } = render(
      <TicketSelector tickets={tickets} value={{ vip: 2 }} onChange={() => {}} />
    );
    const increase = screen.getByLabelText(/Increase VIP/i);
    expect(increase).toBeDisabled();
    rerender(<TicketSelector tickets={tickets} value={{ vip: 1 }} onChange={() => {}} />);
    expect(increase).not.toBeDisabled();
  });
});

