package com.gradingSystem.GraadingSystem.dataStructures;

// MaxHeap implementation for ranking operations
public class MaxHeap {
    private StudentRankNode[] heap;
    private int size;

    // Constructor with initial capacity
    public MaxHeap(int capacity) {
        heap = new StudentRankNode[capacity];
        size = 0;
    }

    // Check if heap is empty
    public boolean isEmpty() {
        return size == 0;
    }

    // Insert new node into the heap
    public void insert(StudentRankNode node) {
        // Add to end and bubble up
        heap[size] = node;
        heapifyUp(size);
        size++;
    }

    // Remove and return the node with highest marks (root)
    public StudentRankNode extractMax() {
        if (size == 0) return null;
        StudentRankNode max = heap[0]; // Root has max marks
        // Move last element to root and bubble down
        heap[0] = heap[--size];
        heapifyDown(0);
        return max;
    }

    //  maintain heap property from child to parent
    private void heapifyUp(int index) {
        while (index > 0) {
            int parent = (index - 1) / 2;
            // If parent has higher or equal marks, stop
            if (heap[parent].getTotalMarks() >= heap[index].getTotalMarks())
                break;
            // Swap parent and child
            swap(parent, index);
            index = parent;
        }
    }

    // Bubble down: maintain heap property from parent to children
    private void heapifyDown(int index) {
        while (index * 2 + 1 < size) { // While has at least left child
            int left = index * 2 + 1;
            int right = left + 1;
            int largest = left; // Assume left child is larger

            // Check if right child exists and is larger than left
            if (right < size &&
                    heap[right].getTotalMarks() > heap[left].getTotalMarks()) {
                largest = right;
            }

            // If current node is larger than or equal to largest child, stop
            if (heap[index].getTotalMarks() >= heap[largest].getTotalMarks())
                break;

            // Swap with larger child
            swap(index, largest);
            index = largest;
        }
    }

    // Helper method to swap two elements in heap
    private void swap(int i, int j) {
        StudentRankNode temp = heap[i];
        heap[i] = heap[j];
        heap[j] = temp;
    }
}