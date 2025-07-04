import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventPricing } from '@/components/events/EventPricing';

describe('EventPricing Component', () => {
  // Test rendering in free mode
  test('renders in free mode by default', () => {
    render(<EventPricing />);
    
    // Check if the switch is present and unchecked
    const switchElement = screen.getByLabelText(/free event/i);
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).not.toBeChecked();
    
    // Check that price fields are not visible
    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/currency/i)).not.toBeInTheDocument();
    
    // Check that attendee limit field is visible
    const attendeeLimit = screen.getByLabelText(/attendee limit/i);
    expect(attendeeLimit).toBeInTheDocument();
  });
  
  // Test rendering in paid mode
  test('renders in paid mode when isPaid is true', () => {
    render(<EventPricing isPaid={true} price={10} priceCurrency="EUR" />);
    
    // Check if the switch is present and checked
    const switchElement = screen.getByLabelText(/paid event/i);
    expect(switchElement).toBeInTheDocument();
    expect(switchElement).toBeChecked();
    
    // Check that price fields are visible
    const priceInput = screen.getByLabelText(/price/i);
    expect(priceInput).toBeInTheDocument();
    expect(priceInput).toHaveValue('10');
    
    const currencySelect = screen.getByLabelText(/currency/i);
    expect(currencySelect).toBeInTheDocument();
    expect(currencySelect).toHaveTextContent('EUR');
  });
  
  // Test rendering in readonly mode
  test('renders readonly view correctly', () => {
    render(
      <EventPricing 
        isPaid={true} 
        price={25.99} 
        priceCurrency="USD" 
        priceDescription="Includes equipment rental" 
        maxAttendees={20}
        readOnly={true}
      />
    );
    
    // Check if the price is displayed correctly
    expect(screen.getByText(/25.99/)).toBeInTheDocument();
    expect(screen.getByText(/USD/)).toBeInTheDocument();
    expect(screen.getByText(/Includes equipment rental/)).toBeInTheDocument();
    expect(screen.getByText(/Limited capacity: 20 attendees/)).toBeInTheDocument();
  });
  
  // Test readonly free event display
  test('renders readonly free event correctly', () => {
    render(<EventPricing isPaid={false} maxAttendees={50} readOnly={true} />);
    
    // Check if "Free event" is displayed
    expect(screen.getByText(/Free event/)).toBeInTheDocument();
    expect(screen.getByText(/Limited capacity: 50 attendees/)).toBeInTheDocument();
  });
  
  // Test toggling between paid and free
  test('toggles between paid and free modes', async () => {
    const handleChange = jest.fn();
    render(<EventPricing onChange={handleChange} />);
    
    // Initially in free mode
    const switchElement = screen.getByLabelText(/free event/i);
    expect(switchElement).not.toBeChecked();
    
    // Toggle to paid mode
    await userEvent.click(switchElement);
    
    // Should change to paid mode
    expect(switchElement).toBeChecked();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    
    // Check that onChange was called with correct data
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      isPaid: true
    }));
    
    // Toggle back to free mode
    await userEvent.click(switchElement);
    
    // Should no longer show price fields
    expect(screen.queryByLabelText(/price/i)).not.toBeInTheDocument();
    
    // Check onChange called with updated data
    expect(handleChange).toHaveBeenLastCalledWith(expect.objectContaining({
      isPaid: false
    }));
  });
  
  // Test changing price
  test('updates price value correctly', async () => {
    const handleChange = jest.fn();
    render(<EventPricing isPaid={true} onChange={handleChange} />);
    
    const priceInput = screen.getByLabelText(/price/i);
    
    // Change price to 15.50
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '15.50');
    
    // Should call onChange with new price
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      isPaid: true,
      price: 15.5
    }));
  });
  
  // Test changing currency
  test('changes currency correctly', async () => {
    const handleChange = jest.fn();
    render(<EventPricing isPaid={true} onChange={handleChange} />);
    
    // Open currency dropdown
    const currencySelect = screen.getByLabelText(/currency/i);
    await userEvent.click(currencySelect);
    
    // Select USD
    const usdOption = screen.getByText(/US Dollar/i);
    await userEvent.click(usdOption);
    
    // Should call onChange with new currency
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      isPaid: true,
      priceCurrency: 'USD'
    }));
  });
  
  // Test setting attendee limit
  test('sets attendee limit correctly', async () => {
    const handleChange = jest.fn();
    render(<EventPricing onChange={handleChange} />);
    
    const limitInput = screen.getByLabelText(/attendee limit/i);
    
    // Set limit to 100
    await userEvent.clear(limitInput);
    await userEvent.type(limitInput, '100');
    
    // Should call onChange with new limit
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      maxAttendees: 100
    }));
  });
  
  // Test price description field
  test('updates price description correctly', async () => {
    const handleChange = jest.fn();
    render(<EventPricing isPaid={true} onChange={handleChange} />);
    
    const descriptionTextarea = screen.getByLabelText(/pricing details/i);
    
    // Add description
    await userEvent.clear(descriptionTextarea);
    await userEvent.type(descriptionTextarea, 'Group discounts available');
    
    // Should call onChange with new description
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      isPaid: true,
      priceDescription: 'Group discounts available'
    }));
  });
  
  // Test prop updates
  test('updates component when props change', () => {
    const { rerender } = render(<EventPricing isPaid={false} />);
    
    // Initially in free mode
    expect(screen.getByLabelText(/free event/i)).not.toBeChecked();
    
    // Update props to paid mode
    rerender(<EventPricing isPaid={true} price={50} priceCurrency="CHF" />);
    
    // Should now be in paid mode
    expect(screen.getByLabelText(/paid event/i)).toBeChecked();
    
    // Price should be updated
    const priceInput = screen.getByLabelText(/price/i);
    expect(priceInput).toHaveValue('50');
  });
}); 