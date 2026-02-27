package com.gradingSystem.GraadingSystem.dataStructures;

// MaxHeap implementation for ranking operations
public class MaxHeap {
    private StudentRankNode[] heap;
    private int size;

    public MaxHeap(int capacity) {
        heap = new StudentRankNode[capacity + 1]; // +1 safety buffer
        size = 0;
    }

    public boolean isEmpty() {
        return size == 0;
    }

    public void insert(StudentRankNode node) {
        heap[size] = node;
        heapifyUp(size);
        size++;
    }

    public StudentRankNode extractMax() {
        if (size == 0) return null;
        StudentRankNode max = heap[0];
        heap[0] = heap[--size];
        heapifyDown(0);
        return max;
    }

    private void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (heap[parent].getTotalMarks() >= heap[index].getTotalMarks()) break;
            swap(parent, index);
            index = parent;
        }
    }

    private void heapifyDown(int index) {
        while (index * 2 + 1 < size) {
            int left  = index * 2 + 1;
            int right = left + 1;
            int largest = left;
            if (right < size && heap[right].getTotalMarks() > heap[left].getTotalMarks()) {
                largest = right;
            }
            if (heap[index].getTotalMarks() >= heap[largest].getTotalMarks()) break;
            swap(index, largest);
            index = largest;
        }
    }

    private void swap(int i, int j) {
        StudentRankNode temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }
}