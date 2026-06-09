import matplotlib.pyplot as plt

hours=['00:00','04:00','08:00','12:00','14:00','14:30','16:00','20:00']
ram=[30, 32, 35, 40, 45, 99, 40, 35]

plt.figure(figsize=(10,6))
plt.plot(hours, ram, color='red', marker='o', linewidth=2)
plt.title('Primary Database Memory Usage (June 8th)')
plt.xlabel('Time (UTC)')
plt.ylabel('RAM Usage (%)')
plt.grid(True)
plt.savefig('sample_data/db_memory_chart.png')
print("Chart generated successfully!")
